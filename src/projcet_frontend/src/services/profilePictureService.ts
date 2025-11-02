import { supabase } from '../config/supabase';

export class ProfilePictureService {
  private static readonly BUCKET_NAME = 'profilePicture';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  /**
   * Upload profile picture to Supabase storage
   */
  static async uploadProfilePicture(file: File, userId: string): Promise<{ url: string; error?: string }> {
    try {
      console.log('📸 Uploading profile picture:', file.name, file.size);
      
      // Validate file type
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        return { 
          url: '', 
          error: 'File must be JPG, PNG, or WebP format' 
        };
      }
      
      // Validate file size
      if (file.size > this.MAX_FILE_SIZE) {
        return { 
          url: '', 
          error: 'File size must be less than 5MB' 
        };
      }
      
      // Generate unique filename (simplified path to avoid RLS issues)
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `profile_${userId}_${Date.now()}.${fileExt}`;
      
      // Delete old profile picture if exists
      await this.deleteOldProfilePicture(userId);
      
      // Upload to Supabase Storage with simplified options
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Allow overwrite to avoid conflicts
        });
      
      if (error) {
        console.error('❌ Upload error:', error);
        
        // Provide more helpful error messages
        if (error.message.includes('row-level security')) {
          return { 
            url: '', 
            error: `Bucket security error. Please ensure the '${this.BUCKET_NAME}' bucket exists and has public access enabled in Supabase Dashboard.` 
          };
        }
        
        return { 
          url: '', 
          error: `Upload failed: ${error.message}` 
        };
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);
      
      console.log('✅ Profile picture uploaded successfully:', publicUrl);
      
      return { url: publicUrl };
    } catch (error) {
      console.error('❌ Error uploading profile picture:', error);
      return { 
        url: '', 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  /**
   * Delete old profile pictures for a user
   */
  private static async deleteOldProfilePicture(userId: string): Promise<void> {
    try {
      // List all files and find user's profile pictures
      const { data: files, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list('', { limit: 1000 });

      if (error || !files) {
        console.log('No files found or error listing files');
        return;
      }

      // Find files that belong to this user
      const userFiles = files.filter(file => 
        file.name.includes(`profile_${userId}_`)
      );
      
      if (userFiles.length > 0) {
        const filePaths = userFiles.map(file => file.name);
        
        const { error: deleteError } = await supabase.storage
          .from(this.BUCKET_NAME)
          .remove(filePaths);

        if (deleteError) {
          console.error('Error deleting old profile pictures:', deleteError);
        } else {
          console.log('✅ Old profile pictures deleted:', filePaths.length);
        }
      }
    } catch (error) {
      console.error('Error in deleteOldProfilePicture:', error);
    }
  }

  /**
   * Get profile picture URL from Supabase storage
   */
  static getProfilePictureUrl(profilePictureUrl: string | null): string | null {
    if (!profilePictureUrl) return null;
    
    // If it's already a full URL, return as is
    if (profilePictureUrl.startsWith('http')) {
      return profilePictureUrl;
    }
    
    // If it's a relative path, construct the full URL
    const { data: { publicUrl } } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(profilePictureUrl);
    
    return publicUrl;
  }

  /**
   * Delete profile picture from storage
   */
  static async deleteProfilePicture(userId: string): Promise<boolean> {
    try {
      await this.deleteOldProfilePicture(userId);
      return true;
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      return false;
    }
  }

  /**
   * Create default profile picture URL placeholder
   */
  static getDefaultProfilePictureUrl(): string {
    return '/assets/profilePicture/default_profile_pict.jpg';
  }

  /**
   * Check if the Supabase storage bucket exists and is accessible
   */
  static async checkStorageAvailability(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list('', { limit: 1 });
      
      return !error;
    } catch (error) {
      console.error('Storage availability check failed:', error);
      return false;
    }
  }

  /**
   * Upload with fallback - try Supabase first, fallback to data URL if fails
   */
  static async uploadWithFallback(file: File, userId: string): Promise<{ url: string; error?: string }> {
    // First try normal Supabase upload
    const result = await this.uploadProfilePicture(file, userId);
    
    if (result.url) {
      return result; // Success!
    }
    
    // If Supabase fails, create a data URL as fallback
    console.log('🔄 Supabase upload failed, using data URL fallback...');
    
    try {
      const dataUrl = await this.fileToDataUrl(file);
      console.log('✅ Using data URL fallback (temporary solution)');
      
      return { 
        url: dataUrl,
        error: `Supabase storage not available. Using temporary solution. Please setup bucket: ${result.error}`
      };
    } catch (error) {
      return {
        url: '',
        error: `Both Supabase and fallback failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Convert file to data URL for fallback
   */
  private static fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          resolve(e.target.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(file);
    });
  }
}
