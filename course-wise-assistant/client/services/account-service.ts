import { Axios } from "@/config/axios"

interface ApiResponse<T> {
  statusCode: number
  data: T
  message: string
  success: boolean
}

export interface UpdateProfilePayload {
  firstName: string
  lastName?: string
}

export interface AccountUser {
  userId: string
  firstName: string
  lastName: string | null
  email: string
  avatar: string | null
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export const updateUserProfile = async (payload: UpdateProfilePayload): Promise<AccountUser> => {
  const response = await Axios.put<ApiResponse<AccountUser>>("/api/auth/update-profile", payload)
  return response.data.data
}

export const changePassword = async (payload: ChangePasswordPayload): Promise<void> => {
  await Axios.put<ApiResponse<Record<string, never>>>("/api/auth/change-password", payload)
}

export const updateProfilePicture = async (avatar: File): Promise<AccountUser> => {
  const formData = new FormData()
  formData.append("avatar", avatar)

  const response = await Axios.put<ApiResponse<AccountUser>>("/api/auth/update-profile-picture", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return response.data.data
}
