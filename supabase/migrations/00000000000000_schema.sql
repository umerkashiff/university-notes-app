-- Create custom types for roles
CREATE TYPE user_role AS ENUM ('admin', 'student');

-- Create a table for public user profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role user_role DEFAULT 'student'::user_role NOT NULL,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  reg_number TEXT,
  phone_number TEXT,
  batch TEXT,
  session TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create semesters table
CREATE TABLE public.semesters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Semesters are viewable by everyone." ON public.semesters FOR SELECT USING (true);
CREATE POLICY "Only admins can modify semesters." ON public.semesters USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  semester_id UUID REFERENCES public.semesters(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subjects are viewable by everyone." ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Only admins can modify subjects." ON public.subjects USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- Create notes table
CREATE TABLE public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  pdf_url TEXT NOT NULL,
  uploader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notes are viewable by everyone." ON public.notes FOR SELECT USING (true);
CREATE POLICY "Only admins can modify notes." ON public.notes USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_semester_id UUID REFERENCES public.semesters(id) ON DELETE CASCADE, -- NULL means all semesters
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notifications viewable by everyone." ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Only admins can modify notifications." ON public.notifications USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );
