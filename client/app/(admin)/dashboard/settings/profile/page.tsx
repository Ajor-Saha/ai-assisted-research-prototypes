"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, UploadCloud, User } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { updateProfileSchema } from "@/schemas/update-profile-schema"
import { updateProfilePicture, updateUserProfile } from "@/services/account-service"
import useAuthStore from "@/store/store"

export default function UpdateProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const form = useForm<z.infer<typeof updateProfileSchema>>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  })

  useEffect(() => {
    if (!user) {
      return
    }

    form.reset({
      firstName: user.firstName,
      lastName: user.lastName || "",
      email: user.email,
    })
  }, [form, user])

  const avatarSource = useMemo(() => {
    if (avatarPreview) {
      return avatarPreview
    }

    return user?.avatar || null
  }, [avatarPreview, user?.avatar])

  const onSubmit = async (values: z.infer<typeof updateProfileSchema>) => {
    setIsSubmitting(true)

    try {
      const updatedUser = await updateUserProfile({
        firstName: values.firstName,
        lastName: values.lastName,
      })

      updateUser({
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName || "",
      })

      toast.success("Profile updated successfully.")
    } catch {
      toast.error("Could not update profile. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAvatarSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Please select a valid image file.")
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.")
      return
    }

    const localPreview = URL.createObjectURL(selectedFile)
    setAvatarPreview(localPreview)

    setIsUploadingAvatar(true)
    try {
      const updatedUser = await updateProfilePicture(selectedFile)
      updateUser({
        avatar: updatedUser.avatar || "",
      })
      setAvatarPreview(null)
      toast.success("Profile picture updated successfully.")
    } catch {
      setAvatarPreview(null)
      toast.error("Could not upload profile picture.")
    } finally {
      setIsUploadingAvatar(false)
      event.target.value = ""
      URL.revokeObjectURL(localPreview)
    }
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Update Profile</CardTitle>
          <CardDescription>Loading your account details...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 relative overflow-hidden border-violet-200 dark:border-violet-800">
        <div className="absolute inset-0 bg-linear-to-br from-violet-50 via-white to-white dark:from-violet-950/20 dark:via-background dark:to-background pointer-events-none" />
        <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-violet-100/50 dark:bg-violet-900/10 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="text-base text-violet-900 dark:text-violet-100">Profile Picture</CardTitle>
          <CardDescription>Upload a clear headshot for your account identity.</CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-violet-400/20 blur-md" />
              <Avatar className="relative h-24 w-24 rounded-2xl ring-2 ring-violet-500/30">
                {avatarSource ? <AvatarImage src={avatarSource} alt={user.firstName} /> : null}
                <AvatarFallback className="rounded-2xl bg-violet-100 dark:bg-violet-900/50">
                  <User className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <label htmlFor="avatar-upload" className="block">
            <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 dark:border-violet-700 p-4 text-sm cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors text-violet-700 dark:text-violet-300">
              {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              {isUploadingAvatar ? "Uploading..." : "Upload new photo"}
            </div>
            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} disabled={isUploadingAvatar} />
          </label>

          <p className="text-xs text-muted-foreground text-center">PNG/JPG up to 5MB</p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Update Profile</CardTitle>
          <CardDescription>Keep your public-facing account details accurate.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input {...field} disabled className="bg-muted/50" />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Email cannot be changed from this panel.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting} className="min-w-40">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
