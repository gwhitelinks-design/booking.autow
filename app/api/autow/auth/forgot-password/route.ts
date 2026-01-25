import { NextRequest, NextResponse } from 'next/server';
import { generateResetToken } from '@/lib/auth';
import pool from '@/lib/db';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Look up user by email (using existing schema)
    const userResult = await pool.query(
      `SELECT id, email, contact_name as name FROM public.users
       WHERE email = $1 AND COALESCE(subscription_status = 'active', true)`,
      [email.toLowerCase()]
    );

    // Always return success to prevent email enumeration attacks
    if (userResult.rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    const user = userResult.rows[0];

    // Generate reset token
    const resetToken = generateResetToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Save token to database (using existing schema column names)
    await pool.query(
      `UPDATE public.users
       SET password_reset_token = $1, password_reset_expires = $2
       WHERE id = $3`,
      [resetToken, resetExpires, user.id]
    );

    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const resetUrl = `${baseUrl}/autow/reset-password?token=${resetToken}`;

    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'AUTOW Services <support@autow-services.co.uk>',
      to: user.email,
      subject: 'Reset Your AUTOW Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #000; padding: 20px; text-align: center;">
            <img src="https://booking.autow-services.co.uk/latest2.png" alt="AUTOW" style="max-width: 150px;"/>
          </div>
          <div style="padding: 30px; background: #f5f5f5;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p style="color: #666;">Hi ${user.name},</p>
            <p style="color: #666;">
              You requested to reset your password for the AUTOW Booking System.
              Click the button below to set a new password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background: #30ff37; color: #000; padding: 15px 30px;
                        text-decoration: none; border-radius: 5px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request this reset,
              you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              AUTOW Services<br>
              Professional Mobile Mechanic & Automotive Services
            </p>
          </div>
        </div>
      `,
    });

    console.log(`Password reset email sent to ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
