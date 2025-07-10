# WorkBrew Cafe Dashboard - Menu Management

This system provides a complete Firebase-backed menu management system for the WorkBrew Cafe Dashboard. It includes features for managing menu items with image uploads, AI-assisted description generation, and real-time updates.

## Features

- **Firebase Integration**: Real-time database with Firestore
- **Image Storage**: Upload and manage menu item images using Firebase Storage
- **AI Description Generator**: Auto-generate menu item descriptions using OpenAI API
- **Category Management**: Filter menu items by categories
- **Search Functionality**: Search across menu items by name or description
- **Responsive Design**: Works on all devices with a modern, user-friendly interface

## Setup Instructions

1. **Install Required Packages**

   You'll need to install the following packages:

   ```bash
   npm install firebase uuid zod
   ```

2. **Firebase Setup**
   - Create a new Firebase project at [firebase.google.com](https://firebase.google.com/)
   - Enable Firestore Database and Storage in your Firebase project
   - Create a web app in your Firebase project and get your configuration
   - Create a `.env.local` file in the root directory based on the `.env.local.example` template
   - Fill in your Firebase configuration values in the `.env.local` file

3. **OpenAI API Setup** (for AI description generation)
   - Sign up for an API key at [OpenAI](https://openai.com/api/)
   - Add your API key to the `.env.local` file

4. **Database Rules**

   Set up these Firestore rules for security:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /menu-items/{document=**} {
         allow read;
         allow write: if request.auth != null;
       }
     }
   }
   ```

5. **Storage Rules**

   Set up these Firebase Storage rules:

   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /menu-items/{allImages=**} {
         allow read;
         allow write: if request.auth != null;
       }
     }
   }
   ```

## File Structure

- `/src/lib/firebase.ts` - Firebase configuration and initialization
- `/src/models/MenuItem.ts` - TypeScript interfaces for menu items
- `/src/services/menuService.ts` - Firebase operations for menu management
- `/src/services/aiService.ts` - OpenAI integration for description generation
- `/src/hooks/useMenu.ts` - Custom React hook for menu operations
- `/src/components/MenuItemCard.tsx` - Component for displaying menu items
- `/src/components/MenuItemForm.tsx` - Form for adding/editing menu items
- `/src/components/ConfirmationDialog.tsx` - Reusable confirmation dialog
- `/src/app/api/menu/generate-description/route.ts` - API route for AI description generation
- `/src/app/dashboard/menu/page.tsx` - Main menu management page

## Usage

### Adding Menu Items

1. Click the "Add Item" button
2. Fill in the details (name, price, category, etc.)
3. Upload an image if desired
4. Use the "AI Generate" button to auto-generate a description
5. Click "Add Item" to save

### Editing Menu Items

1. Click the edit button on a menu item
2. Modify the details as needed
3. Click "Update Item" to save changes

### Deleting Menu Items

1. Click the delete button on a menu item
2. Confirm deletion in the confirmation dialog

### Toggling Availability

- Click the toggle button on a menu item to mark it as available/unavailable

## Customization

### Adding New Categories

Edit the DEFAULT_CATEGORIES array in `/src/models/MenuItem.ts` to add new default categories.

### Styling

The components use Tailwind CSS for styling. You can modify the styles in the component files or use the Tailwind configuration file.

## Troubleshooting

If you encounter issues:

1. Check the browser console for errors
2. Ensure all environment variables are correctly set in `.env.local`
3. Verify Firebase project settings and permissions

## License

This project is licensed under the MIT License.
