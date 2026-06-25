import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { Request, Response } from 'express';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { userTable } from '../db/schema/tbl-user';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';
import { createR2Client } from '../utils/upload-r2';

export const signup = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Validate required fields
    if (
      [firstName, lastName, email, password].some(
        field => !field || field.trim() === ''
      )
    ) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, 'All fields are required'));
    }

    // Check if the user already exists by email
    const existingUserByEmail = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email));

    if (existingUserByEmail.length > 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, 'User already exists with this email')
        );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = {
      userId: uuidv4(),
      firstName,
      lastName,
      email,
      password: hashedPassword,
    };

    await db.insert(userTable).values(newUser);

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { newUser },
          'User registered successfully'
        )
      );
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
  }
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if ([email, password].some(field => !field || field.trim() === '')) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, 'Email and password are required'));
    }

    const user = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email));

    if (!user || user.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            {},
            'User not found'
          )
        );
    }

    const isPasswordValid = await bcrypt.compare(password, user[0].password);

    if (!isPasswordValid) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, 'Invalid credentials'));
    }

    let accessToken;
    try {
      accessToken = jwt.sign(
        { userId: user[0].userId, email: user[0].email },
        process.env.JWT_SECRET as string,
        { expiresIn: '1d' }
      );
    } catch (jwtError) {
      console.error('JWT Error:', jwtError);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Failed to generate token'));
    }

    // Cookie options based on environment
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 72 * 60 * 60 * 1000, // 3 days
      sameSite:
        process.env.NODE_ENV === 'production'
          ? ('none' as const)
          : ('lax' as const),
      ...(process.env.NODE_ENV === 'production' && {
        domain: '.devtunnels.ms',
      }),
      path: '/',
    };

    // Set the access token as a cookie
    res.cookie('accessToken', accessToken, cookieOptions);

    const loginUser = user[0];

    return res.status(200).json({
      success: true,
      data: loginUser,
      accessToken: accessToken,
      message: 'Login successful',
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal server error'));
  }
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, 'Unauthorized request'));
    }

    // Cookie clearing options based on environment
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite:
        process.env.NODE_ENV === 'production'
          ? ('none' as const)
          : ('lax' as const),
      ...(process.env.NODE_ENV === 'production' && {
        domain: '.devtunnels.ms',
      }),
      path: '/',
    };

    res.clearCookie('accessToken', cookieOptions);

    return res.status(200).json(new ApiResponse(200, {}, 'Logout successful'));
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Internal server error'));
  }
});

export const updateProfilePicture = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Ensure the authenticated user exists
      const authUser = req.user;
      if (!authUser) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'Unauthorized: User is missing'));
      }

      const file = req.avatar;

      if (!file || !file.filepath) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'No file uploaded or invalid file'));
      }

      // Create R2 client (S3-compatible client)
      const r2 = createR2Client();

      // Retrieve existing user from the database
      const existingUser = await db
        .select()
        .from(userTable)
        .where(eq(userTable.userId, authUser.userId))
        .limit(1);

      if (!existingUser.length) {
        return res.status(404).json(new ApiResponse(404, {}, 'User not found'));
      }

      const existedUser = existingUser[0];

      // Delete previous profile picture from R2 if it exists
      if (existedUser.avatar) {
        const currentImageKey = existedUser.avatar.replace(
          `${process.env.PUBLIC_ACCESS_URL}/`,
          ''
        );
        if (currentImageKey) {
          await r2.send(
            new DeleteObjectCommand({
              Bucket: process.env.BUCKET_NAME!,
              Key: currentImageKey,
            })
          );
        }
      }

      // Read the file from the temporary path
      const buffer = await fs.readFile(file.filepath);
      const uniqueFileName = `${nanoid()}-${encodeURIComponent(
        file.originalFilename || 'unnamed'
      )}`;

      // Upload new profile picture to R2
      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.BUCKET_NAME!,
          Key: uniqueFileName,
          Body: buffer,
          ContentType: file.mimetype || 'application/octet-stream',
        })
      );

      // Clean up the temporary file
      await fs.unlink(file.filepath);

      // Construct new profile picture URL
      const profileUrl = `${process.env.PUBLIC_ACCESS_URL}/${uniqueFileName}`;

      // Update the user record in the database
      await db
        .update(userTable)
        .set({ avatar: profileUrl })
        .where(eq(userTable.userId, authUser.userId))
        .execute();

      // Fetch updated user data
      const updatedUser = await db
        .select()
        .from(userTable)
        .where(eq(userTable.userId, authUser.userId))
        .limit(1);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedUser[0],
            'Profile picture updated successfully'
          )
        );
    } catch (error) {
      console.error('Error updating profile picture:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Ensure the authenticated user exists
      const authUser = req.user;
      if (!authUser) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'Not authenticated'));
      }

      // Extract the fields from the request body
      const { currentPassword, newPassword } = req.body;

      // Validate required fields
      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              'Current password and new password are required'
            )
          );
      }

      // Check if user exists
      const user = await db
        .select()
        .from(userTable)
        .where(eq(userTable.userId, authUser.userId))
        .limit(1);

      if (!user.length) {
        return res
          .status(400)
          .json(
            new ApiResponse(400, {}, 'User does not exist')
          );
      }

      const existingUser = user[0];

      // Verify current password
      const isMatch = await bcrypt.compare(
        currentPassword,
        existingUser.password
      );
      if (!isMatch) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Current password is incorrect'));
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password
      await db
        .update(userTable)
        .set({ password: hashedPassword })
        .where(eq(userTable.userId, authUser.userId));

      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Password updated successfully'));
    } catch (error) {
      console.error('Error updating password:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, 'Error updating password'));
    }
  }
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (
        !email ||
        !password ||
        email.trim() === '' ||
        password.trim() === ''
      ) {
        return res
          .status(400)
          .json(
            new ApiResponse(400, {}, 'Email and new password are required')
          );
      }

      // Check if user exists
      const user = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, email))
        .limit(1);

      if (!user.length) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'User not found'));
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update the user's password
      await db
        .update(userTable)
        .set({ password: hashedPassword })
        .where(eq(userTable.email, email));

      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Password reset successfully'));
    } catch (error) {
      console.error('Error resetting password:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, 'Error resetting password'));
    }
  }
);

export const updateUserProfile = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Ensure the authenticated user exists
      const authUser = req.user;
      if (!authUser) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'Not authenticated'));
      }

      // Extract the fields from the request body
      const { firstName, lastName } = req.body;

      // Validate required fields
      if (!firstName || firstName.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'First name is required'));
      }

      // Check if user exists
      const user = await db
        .select()
        .from(userTable)
        .where(eq(userTable.userId, authUser.userId))
        .limit(1);

      if (!user.length) {
        return res
          .status(400)
          .json(
            new ApiResponse(400, {}, 'User does not exist')
          );
      }

      // Prepare update data
      const updateData: {
        firstName: string;
        lastName?: string | null;
      } = {
        firstName: firstName.trim(),
      };

      // Only include lastName in update if it's provided
      if (lastName !== undefined) {
        updateData.lastName = lastName.trim() || null;
      }

      // Update the user's profile
      const [updatedUser] = await db
        .update(userTable)
        .set(updateData)
        .where(eq(userTable.userId, authUser.userId))
        .returning();

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            userId: updatedUser.userId,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            avatar: updatedUser.avatar,
          },
          'Profile updated successfully'
        )
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, 'Error updating profile'));
    }
  }
);

// Server status controller for sign-in page
export const getServerStatus = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Simulate server wake-up time (you can adjust this based on your needs)
      const serverStartTime = process.uptime(); // Time since server started in seconds
      const isServerReady = serverStartTime > 5; // Consider server ready after 5 seconds

      let status = 'starting';
      let message = 'Server is starting, please wait a moment...';

      if (isServerReady) {
        status = 'ready';
        message = 'Server is ready! You can now sign in.';
      } else if (serverStartTime > 2) {
        status = 'waking';
        message = 'Server is waking up from sleeping mode...';
      } else if (serverStartTime > 1) {
        status = 'starting';
        message = 'Server is starting, please wait a moment...';
      } else {
        status = 'initializing';
        message =
          'Server is initializing, this will only take a few seconds...';
      }

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            status,
            message,
            uptime: Math.floor(serverStartTime),
            isReady: isServerReady,
          },
          'Server status retrieved successfully'
        )
      );
    } catch (error) {
      console.error('Error getting server status:', error);
      return res.status(500).json(
        new ApiResponse(
          500,
          {
            status: 'error',
            message: 'Unable to check server status',
            isReady: false,
          },
          'Error getting server status'
        )
      );
    }
  }
);
