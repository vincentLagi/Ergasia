/**
 * Debug utility for troubleshooting user data issues
 */

import { storage } from './storage';

export function debugUserData() {
  try {
    console.log('------ USER DATA DEBUG ------');
    
    // Check raw localStorage data
    const rawUserString = localStorage.getItem('current_user');
    console.log('Raw current_user from localStorage:', rawUserString);
    
    // Check session data
    const rawSessionString = localStorage.getItem('session');
    console.log('Raw session from localStorage:', rawSessionString);
    
    // Check parsed data
    if (rawUserString) {
      try {
        const parsedUser = JSON.parse(rawUserString);
        console.log('Parsed user data:', parsedUser);
        
        // Check for nested structure
        if (parsedUser.ok) {
          console.log('User data is nested in "ok" property:', parsedUser.ok);
          console.log('User ID in nested structure:', parsedUser.ok.id);
        } else {
          console.log('User data is not nested');
          console.log('User ID in direct structure:', parsedUser.id);
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    // Check storage utility
    const userData = storage.getUser();
    console.log('User data from storage utility:', userData);
    if (userData) {
      console.log('User ID from storage utility:', userData.id);
    }
    
    console.log('------ END USER DATA DEBUG ------');
    
    return !!userData;
  } catch (error) {
    console.error('Error in debugUserData:', error);
    return false;
  }
}
