import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import * as materialService from '@/services/material-service';
import type { Material, CreateMaterialDTO, UpdateMaterialDTO } from '@/services/material-service';

interface MaterialState {
  materials: Material[];
  currentMaterial: Material | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCourseMaterials: (courseId: string) => Promise<void>;
  fetchTopicMaterials: (topicId: string) => Promise<void>;
  fetchMaterialById: (materialId: string) => Promise<void>;
  createMaterial: (data: CreateMaterialDTO) => Promise<Material>;
  updateMaterial: (materialId: string, data: UpdateMaterialDTO) => Promise<Material>;
  deleteMaterial: (materialId: string) => Promise<void>;
  setCurrentMaterial: (material: Material | null) => void;
  clearError: () => void;
}

export const useMaterialStore = create<MaterialState>()(
  devtools(
    (set) => ({
      materials: [],
      currentMaterial: null,
      isLoading: false,
      error: null,

      fetchCourseMaterials: async (courseId: string) => {
        set({ isLoading: true, error: null });
        try {
          const materials = await materialService.getCourseMaterials(courseId);
          set({ materials, isLoading: false });
        } catch (error) {
          set({
            error: (error as any).response?.data?.message || 'Failed to fetch materials',
            isLoading: false,
          });
        }
      },

      fetchTopicMaterials: async (topicId: string) => {
        set({ isLoading: true, error: null });
        try {
          const materials = await materialService.getTopicMaterials(topicId);
          set({ materials, isLoading: false });
        } catch (error) {
          set({
            error: (error as any).response?.data?.message || 'Failed to fetch materials',
            isLoading: false,
          });
        }
      },

      fetchMaterialById: async (materialId: string) => {
        set({ isLoading: true, error: null });
        try {
          const material = await materialService.getMaterialById(materialId);
          set({ currentMaterial: material, isLoading: false });
        } catch (error) {
          set({
            error: (error as any).response?.data?.message || 'Failed to fetch material',
            isLoading: false,
          });
        }
      },

      createMaterial: async (data: CreateMaterialDTO) => {
        set({ isLoading: true, error: null });
        try {
          const newMaterial = await materialService.createMaterial(data);
          set((state) => ({
            materials: [...state.materials, newMaterial],
            isLoading: false,
          }));
          return newMaterial;
        } catch (error) {
          set({
            error: (error as any).response?.data?.message || 'Failed to create material',
            isLoading: false,
          });
          throw error;
        }
      },

      updateMaterial: async (materialId: string, data: UpdateMaterialDTO) => {
        set({ isLoading: true, error: null });
        try {
          const updatedMaterial = await materialService.updateMaterial(materialId, data);
          set((state) => ({
            materials: state.materials.map((material) =>
              material.materialId === materialId ? updatedMaterial : material
            ),
            currentMaterial:
              state.currentMaterial?.materialId === materialId
                ? updatedMaterial
                : state.currentMaterial,
            isLoading: false,
          }));
          return updatedMaterial;
        } catch (error) {
          set({
            error: (error as any).response?.data?.message || 'Failed to update material',
            isLoading: false,
          });
          throw error;
        }
      },

      deleteMaterial: async (materialId: string) => {
        set({ isLoading: true, error: null });
        try {
          await materialService.deleteMaterial(materialId);
          set((state) => ({
            materials: state.materials.filter((material) => material.materialId !== materialId),
            currentMaterial:
              state.currentMaterial?.materialId === materialId ? null : state.currentMaterial,
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: (error as any).response?.data?.message || 'Failed to delete material',
            isLoading: false,
          });
          throw error;
        }
      },

      setCurrentMaterial: (material: Material | null) => set({ currentMaterial: material }),

      clearError: () => set({ error: null }),
    }),
    { name: 'material-store' }
  )
);
