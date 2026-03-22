import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { eq, and } from 'drizzle-orm';
import { Request, Response } from 'express';
import fs from 'fs/promises';
import { nanoid } from 'nanoid';
import { Readable } from 'stream';
import { db } from '../db';
import { materialTable, courseTable, topicTable } from '../db/schema';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';
import { createR2Client } from '../utils/upload-r2';

// Create a new material
export const createMaterial = asyncHandler(
  async (req: Request & { user?: any; materialFile?: any }, res: Response) => {
    try {
      const { courseId, topicId, name, description, type, url } = req.body;
      const userId = req.user?.userId;
      const uploadedFile = req.materialFile;

      // Validate required fields
      if (!name || name.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Material name is required'));
      }

      if (!courseId) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Course ID is required'));
      }

      if (!type) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Material type is required'));
      }

      // Either file upload or URL must be provided
      if (!uploadedFile && !url) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Either file upload or URL is required'));
      }

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Verify the course belongs to the user
      const [course] = await db
        .select()
        .from(courseTable)
        .where(eq(courseTable.courseId, courseId));

      if (!course) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Course not found'));
      }

      if (course.userId !== userId) {
        return res
          .status(403)
          .json(
            new ApiResponse(403, {}, 'You are not authorized to add materials to this course')
          );
      }

      // If topicId is provided, verify it exists and belongs to the course
      if (topicId) {
        const [topic] = await db
          .select()
          .from(topicTable)
          .where(eq(topicTable.topicId, topicId));

        if (!topic) {
          return res
            .status(404)
            .json(new ApiResponse(404, {}, 'Topic not found'));
        }

        if (topic.courseId !== courseId) {
          return res
            .status(400)
            .json(new ApiResponse(400, {}, 'Topic does not belong to this course'));
        }
      }

      let materialUrl = url;
      let fileSize = null;

      // If file is uploaded, handle R2 upload
      if (uploadedFile && uploadedFile.filepath) {
        try {
          console.log('File upload details:', {
            filepath: uploadedFile.filepath,
            originalFilename: uploadedFile.originalFilename,
            mimetype: uploadedFile.mimetype,
            size: uploadedFile.size,
          });

          // Create R2 client
          const r2 = createR2Client();

          // Read the file from the temporary path
          const buffer = await fs.readFile(uploadedFile.filepath);
          const uniqueFileName = `materials/${nanoid()}-${encodeURIComponent(
            uploadedFile.originalFilename || 'unnamed'
          )}`;

          console.log('Uploading to R2:', {
            bucket: process.env.BUCKET_NAME,
            key: uniqueFileName,
            size: buffer.length,
          });

          // Upload file to R2
          await r2.send(
            new PutObjectCommand({
              Bucket: process.env.BUCKET_NAME!,
              Key: uniqueFileName,
              Body: buffer,
              ContentType: uploadedFile.mimetype || 'application/octet-stream',
            })
          );

          console.log('File uploaded successfully to R2');

          // Clean up the temporary file
          await fs.unlink(uploadedFile.filepath);

          // Construct file URL
          materialUrl = `${process.env.PUBLIC_ACCESS_URL}/${uniqueFileName}`;
          
          // Get file size in bytes
          fileSize = uploadedFile.size;
        } catch (error) {
          console.error('Error uploading file to R2:', error);
          // Clean up temp file even if upload failed
          try {
            if (uploadedFile.filepath) {
              await fs.unlink(uploadedFile.filepath);
            }
          } catch (unlinkError) {
            console.error('Error cleaning up temp file:', unlinkError);
          }
          return res
            .status(500)
            .json(new ApiResponse(500, {}, 'Failed to upload file'));
        }
      }

      // Create new material
      const newMaterial = {
        materialId: nanoid(),
        courseId,
        topicId: topicId || null,
        name: name.trim(),
        description: description?.trim() || null,
        type,
        url: materialUrl,
        fileSize: fileSize,
        parsingStatus: uploadedFile ? 'pending' : null, // Only parse uploaded files
      };

      const [createdMaterial] = await db
        .insert(materialTable)
        .values(newMaterial)
        .returning();

      // Trigger parsing directly if file was uploaded (synchronous pipeline)
      if (uploadedFile && materialUrl) {
        console.log('🚀 Starting automatic parsing for material:', createdMaterial.materialId);
        
        // Import parsing function dynamically to avoid circular dependencies
        const { parseMaterialContentInternal } = await import('./material-parsing-controller');
        
        // Start parsing in background - don't wait for it to complete
        parseMaterialContentInternal(createdMaterial.materialId, materialUrl)
          .then(() => {
            console.log('✅ Parsing completed for material:', createdMaterial.materialId);
          })
          .catch((error) => {
            console.error('❌ Parsing failed for material:', createdMaterial.materialId, error.message);
          });
      }

      return res
        .status(201)
        .json(
          new ApiResponse(
            201, 
            {
              ...createdMaterial,
              parsingTriggered: !!uploadedFile,
            }, 
            uploadedFile 
              ? 'Material created successfully. Parsing started in background.'
              : 'Material created successfully'
          )
        );
    } catch (error) {
      console.error('Error creating material:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Get all materials for a course
export const getCourseMaterials = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const courseId = req.params.courseId as string;
      const userId = req.user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Verify the course belongs to the user
      const [course] = await db
        .select()
        .from(courseTable)
        .where(eq(courseTable.courseId, courseId));

      if (!course) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Course not found'));
      }

      if (course.userId !== userId) {
        return res
          .status(403)
          .json(
            new ApiResponse(403, {}, 'You are not authorized to access this course')
          );
      }

      const materials = await db
        .select()
        .from(materialTable)
        .where(eq(materialTable.courseId, courseId))
        .orderBy(materialTable.createdAt);

      return res
        .status(200)
        .json(
          new ApiResponse(200, materials, 'Materials fetched successfully')
        );
    } catch (error) {
      console.error('Error fetching materials:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Get materials by topic
export const getTopicMaterials = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const topicId = req.params.topicId as string;
      const userId = req.user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Verify the topic's course belongs to the user
      const [topic] = await db
        .select()
        .from(topicTable)
        .where(eq(topicTable.topicId, topicId));

      if (!topic) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Topic not found'));
      }

      const [course] = await db
        .select()
        .from(courseTable)
        .where(eq(courseTable.courseId, topic.courseId));

      if (!course || course.userId !== userId) {
        return res
          .status(403)
          .json(
            new ApiResponse(403, {}, 'You are not authorized to access this topic')
          );
      }

      const materials = await db
        .select()
        .from(materialTable)
        .where(eq(materialTable.topicId, topicId))
        .orderBy(materialTable.createdAt);

      return res
        .status(200)
        .json(
          new ApiResponse(200, materials, 'Materials fetched successfully')
        );
    } catch (error) {
      console.error('Error fetching materials:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Get a single material by ID
export const getMaterialById = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const materialId = req.params.materialId as string;
      const userId = req.user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      const [material] = await db
        .select()
        .from(materialTable)
        .where(eq(materialTable.materialId, materialId));

      if (!material) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Material not found'));
      }

      // Verify the course belongs to the user
      const [course] = await db
        .select()
        .from(courseTable)
        .where(eq(courseTable.courseId, material.courseId));

      if (!course || course.userId !== userId) {
        return res
          .status(403)
          .json(
            new ApiResponse(403, {}, 'You are not authorized to access this material')
          );
      }

      return res
        .status(200)
        .json(new ApiResponse(200, material, 'Material fetched successfully'));
    } catch (error) {
      console.error('Error fetching material:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Update a material
export const updateMaterial = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const materialId = req.params.materialId as string;
      const { name, description, topicId, type, url, fileSize } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Check if material exists
      const [existingMaterial] = await db
        .select()
        .from(materialTable)
        .where(eq(materialTable.materialId, materialId));

      if (!existingMaterial) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Material not found'));
      }

      // Verify the course belongs to the user
      const [course] = await db
        .select()
        .from(courseTable)
        .where(eq(courseTable.courseId, existingMaterial.courseId));

      if (!course || course.userId !== userId) {
        return res
          .status(403)
          .json(
            new ApiResponse(403, {}, 'You are not authorized to update this material')
          );
      }

      // If topicId is being updated, verify it exists and belongs to the course
      if (topicId !== undefined && topicId !== null) {
        const [topic] = await db
          .select()
          .from(topicTable)
          .where(eq(topicTable.topicId, topicId));

        if (!topic) {
          return res
            .status(404)
            .json(new ApiResponse(404, {}, 'Topic not found'));
        }

        if (topic.courseId !== existingMaterial.courseId) {
          return res
            .status(400)
            .json(new ApiResponse(400, {}, 'Topic does not belong to this course'));
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (name !== undefined && name.trim() !== '') {
        updateData.name = name.trim();
      }
      if (description !== undefined) {
        updateData.description = description?.trim() || null;
      }
      if (topicId !== undefined) {
        updateData.topicId = topicId || null;
      }
      if (type !== undefined) {
        updateData.type = type;
      }
      if (url !== undefined) {
        updateData.url = url;
      }
      if (fileSize !== undefined) {
        updateData.fileSize = fileSize || null;
      }

      // Update material
      const [updatedMaterial] = await db
        .update(materialTable)
        .set(updateData)
        .where(eq(materialTable.materialId, materialId))
        .returning();

      return res
        .status(200)
        .json(
          new ApiResponse(200, updatedMaterial, 'Material updated successfully')
        );
    } catch (error) {
      console.error('Error updating material:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Delete a material
export const deleteMaterial = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const materialId = req.params.materialId as string;
      const userId = req.user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Check if material exists
      const [existingMaterial] = await db
        .select()
        .from(materialTable)
        .where(eq(materialTable.materialId, materialId));

      if (!existingMaterial) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Material not found'));
      }

      // Verify the course belongs to the user
      const [course] = await db
        .select()
        .from(courseTable)
        .where(eq(courseTable.courseId, existingMaterial.courseId));

      if (!course || course.userId !== userId) {
        return res
          .status(403)
          .json(
            new ApiResponse(403, {}, 'You are not authorized to delete this material')
          );
      }

      // Delete material
      await db.delete(materialTable).where(eq(materialTable.materialId, materialId));

      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Material deleted successfully'));
    } catch (error) {
      console.error('Error deleting material:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

/**
 * View/Download material file from R2
 * @route GET /api/materials/:materialId/view
 */
export const viewMaterial = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const materialId = req.params.materialId as string;
      const userId = req.user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Fetch material
      const [material] = await db
        .select()
        .from(materialTable)
        .where(eq(materialTable.materialId, materialId));

      if (!material) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Material not found'));
      }

      // Verify the course belongs to the user
      const [course] = await db
        .select()
        .from(courseTable)
        .where(eq(courseTable.courseId, material.courseId));

      if (!course || course.userId !== userId) {
        return res
          .status(403)
          .json(
            new ApiResponse(403, {}, 'You are not authorized to access this material')
          );
      }

      // If the URL doesn't start with the R2 domain, redirect to it
      if (!material.url.startsWith(process.env.PUBLIC_ACCESS_URL || '')) {
        return res.redirect(material.url);
      }

      // Extract the key from the URL
      const key = material.url.replace(`${process.env.PUBLIC_ACCESS_URL}/`, '');

      console.log('Fetching file from R2:', {
        bucket: process.env.BUCKET_NAME,
        key,
      });

      // Create R2 client
      const r2 = createR2Client();

      // Get the object from R2
      const command = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: key,
      });

      const response = await r2.send(command);

      if (!response.Body) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'File not found in storage'));
      }

      // Set appropriate headers
      res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');
      if (response.ContentLength) {
        res.setHeader('Content-Length', response.ContentLength.toString());
      }
      
      // Set content disposition for inline viewing (PDFs, images) or download
      const filename = material.name || 'download';
      if (material.type === 'pdf' || material.type === 'image') {
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
      } else {
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      }

      // Enable CORS for browser access
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');

      // Stream the file to the client
      const stream = response.Body as Readable;
      stream.pipe(res);

    } catch (error) {
      console.error('Error viewing material:', error);
      if (!res.headersSent) {
        res
          .status(500)
          .json(new ApiResponse(500, null, 'Failed to retrieve file'));
      }
    }
  }
);
