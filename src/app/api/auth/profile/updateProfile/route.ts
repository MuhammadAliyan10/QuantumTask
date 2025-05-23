import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { user } = await validateRequest();
  const body = await request.json();
  const { userId, fullName, bio, instagram, twitter, website } = body;

  if (!user || user.id !== userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!fullName)
    return NextResponse.json(
      { error: "Full name is required" },
      { status: 400 }
    );

  try {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { fullName, bio, socialLinks: { instagram, twitter, website } },
    });
    return NextResponse.json(
      { message: "Profile updated successfully", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
