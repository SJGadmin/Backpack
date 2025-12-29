'use server';

import { redirect } from 'next/navigation';
import * as bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    redirect('/login?error=missing_fields');
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    redirect('/login?error=invalid_credentials');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    redirect('/login?error=invalid_credentials');
  }

  // Create session
  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;
  session.isLoggedIn = true;
  await session.save();

  redirect('/board');
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect('/login');
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  return user;
}
