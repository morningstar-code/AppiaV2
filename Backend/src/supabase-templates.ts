export const supabaseTemplates = {
  todo: {
    description: 'Todo app with Supabase database',
    prompt: `Create a todo app with Supabase integration. Include:
    - User authentication with Supabase Auth
    - Real-time todos table with user_id, text, completed, created_at
    - Add, edit, delete, and toggle todo functionality
    - Real-time updates using Supabase subscriptions
    - Clean, modern UI with responsive design`,
    schema: {
      tables: {
        todos: {
          columns: [
            { name: 'id', type: 'uuid', primaryKey: true, default: 'gen_random_uuid()' },
            { name: 'user_id', type: 'uuid', references: 'auth.users(id)', onDelete: 'CASCADE' },
            { name: 'text', type: 'text', required: true },
            { name: 'completed', type: 'boolean', default: false },
            { name: 'created_at', type: 'timestamptz', default: 'now()' }
          ]
        }
      }
    }
  },

  chat: {
    description: 'Chat app with Supabase real-time messaging',
    prompt: `Create a chat app with Supabase integration. Include:
    - User authentication with Supabase Auth
    - Real-time messages with user_id, content, created_at, room_id
    - Multiple chat rooms functionality
    - Real-time updates using Supabase subscriptions
    - Message history and user presence
    - Clean chat interface with message bubbles`,
    schema: {
      tables: {
        rooms: {
          columns: [
            { name: 'id', type: 'uuid', primaryKey: true, default: 'gen_random_uuid()' },
            { name: 'name', type: 'text', required: true },
            { name: 'created_by', type: 'uuid', references: 'auth.users(id)' },
            { name: 'created_at', type: 'timestamptz', default: 'now()' }
          ]
        },
        messages: {
          columns: [
            { name: 'id', type: 'uuid', primaryKey: true, default: 'gen_random_uuid()' },
            { name: 'user_id', type: 'uuid', references: 'auth.users(id)', onDelete: 'CASCADE' },
            { name: 'room_id', type: 'uuid', references: 'rooms(id)', onDelete: 'CASCADE' },
            { name: 'content', type: 'text', required: true },
            { name: 'created_at', type: 'timestamptz', default: 'now()' }
          ]
        }
      }
    }
  },

  blog: {
    description: 'Blog with Supabase CMS',
    prompt: `Create a blog app with Supabase integration. Include:
    - User authentication with Supabase Auth
    - Posts table with title, content, author_id, created_at, published
    - Rich text editor for blog posts
    - Categories and tags system
    - Comment system with moderation
    - SEO-friendly URLs and meta tags
    - Admin dashboard for content management`,
    schema: {
      tables: {
        categories: {
          columns: [
            { name: 'id', type: 'uuid', primaryKey: true, default: 'gen_random_uuid()' },
            { name: 'name', type: 'text', required: true },
            { name: 'slug', type: 'text', unique: true }
          ]
        },
        posts: {
          columns: [
            { name: 'id', type: 'uuid', primaryKey: true, default: 'gen_random_uuid()' },
            { name: 'title', type: 'text', required: true },
            { name: 'slug', type: 'text', unique: true },
            { name: 'content', type: 'text', required: true },
            { name: 'excerpt', type: 'text' },
            { name: 'author_id', type: 'uuid', references: 'auth.users(id)' },
            { name: 'category_id', type: 'uuid', references: 'categories(id)' },
            { name: 'published', type: 'boolean', default: false },
            { name: 'published_at', type: 'timestamptz' },
            { name: 'created_at', type: 'timestamptz', default: 'now()' },
            { name: 'updated_at', type: 'timestamptz', default: 'now()' }
          ]
        },
        comments: {
          columns: [
            { name: 'id', type: 'uuid', primaryKey: true, default: 'gen_random_uuid()' },
            { name: 'post_id', type: 'uuid', references: 'posts(id)', onDelete: 'CASCADE' },
            { name: 'user_id', type: 'uuid', references: 'auth.users(id)' },
            { name: 'content', type: 'text', required: true },
            { name: 'approved', type: 'boolean', default: false },
            { name: 'created_at', type: 'timestamptz', default: 'now()' }
          ]
        }
      }
    }
  },

  ecommerce: {
    description: 'E-commerce store with Supabase',
    prompt: `Create an e-commerce app with Supabase integration. Include:
    - User authentication with Supabase Auth
    - Products catalog with categories, prices, inventory
    - Shopping cart functionality
    - Order management system
    - Payment integration ready
    - Admin panel for product management
    - Product reviews and ratings
    - Search and filtering capabilities`,
    schema: {
      tables: {
        categories: {
          columns: [
            { name: 'id', type: 'uuid', primaryKey: true, default: 'gen_random_uuid()' },
            { name: 'name', type: 'text', required: true },
            { name: 'slug', type: 'text', unique: true },
            { name: 'description', type: 'text' }
          ]
        },
        products: {
          columns: [
            { name: 'id', type: 'uuid', primaryKey: true, default: 'gen_random_uuid()' },
            { name: 'name', type: 'text', required: true },
            { name: 'slug', type: 'text', unique: true },
            { name: 'description', type: 'text', required: true },
            { name: 'price', type: 'decimal', required: true },
            { name: 'category_id', type: 'uuid', references: 'categories(id)' },
            { name: 'inventory', type: 'integer', default: 0 },
            { name: 'images', type: 'jsonb' },
            { name: 'active', type: 'boolean', default: true },
            { name: 'created_at', type: 'timestamptz', default: 'now()' },
            { name: 'updated_at', type: 'timestamptz', default: 'now()' }
          ]
        },
        cart_items: {
          columns: [
            { name: 'id', type: 'uuid', primaryKey: true, default: 'gen_random_uuid()' },
            { name: 'user_id', type: 'uuid', references: 'auth.users(id)', onDelete: 'CASCADE' },
            { name: 'product_id', type: 'uuid', references: 'products(id)', onDelete: 'CASCADE' },
            { name: 'quantity', type: 'integer', required: true },
            { name: 'created_at', type: 'timestamptz', default: 'now()' }
          ]
        },
        orders: {
          columns: [
            { name: 'id', type: 'uuid', primaryKey: true, default: 'gen_random_uuid()' },
            { name: 'user_id', type: 'uuid', references: 'auth.users(id)' },
            { name: 'total', type: 'decimal', required: true },
            { name: 'status', type: 'text', default: 'pending' },
            { name: 'shipping_address', type: 'jsonb' },
            { name: 'created_at', type: 'timestamptz', default: 'now()' }
          ]
        }
      }
    }
  }
};

export const supabaseEnvironmentTemplate = {
  client: `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Database = {
  // Add your database types here
  public: {
    Tables: {
      // Add table types here
    }
    Views: {
      // Add view types here
    }
    Functions: {
      // Add function types here
    }
  }
}`,

  config: `# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`,

  schema: `# Supabase Database Schema
# Run these SQL commands in your Supabase SQL editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-jwt-secret';

-- Create tables based on your app requirements
-- Example for todo app:
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own todos" ON todos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own todos" ON todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos" ON todos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos" ON todos
  FOR DELETE USING (auth.uid() = user_id);`
};
