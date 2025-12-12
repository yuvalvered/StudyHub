"""
Email service for sending verification and notification emails.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails."""

    @staticmethod
    def send_email(to_email: str, subject: str, html_content: str) -> bool:
        """
        Send an email using SMTP.

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email

        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
            message["To"] = to_email

            # Attach HTML content
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)

            # Send email
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(message)

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    @staticmethod
    def send_verification_email(to_email: str, username: str, verification_token: str) -> bool:
        """
        Send email verification email to user.

        Args:
            to_email: User's email address
            username: User's username
            verification_token: Email verification token

        Returns:
            True if email sent successfully, False otherwise
        """
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"

        subject = "Verify your email for StudyHub"

        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f4f4f4; border-radius: 10px; padding: 30px;">
                <h1 style="color: #2c3e50; text-align: center;">Welcome to StudyHub!</h1>

                <p>Hello {username},</p>

                <p>Thank you for signing up for StudyHub - the platform for sharing university study materials.</p>

                <p>To complete your registration, please verify your university email address by clicking the button below:</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}"
                       style="background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                        Verify Email Address
                    </a>
                </div>

                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #3498db;">{verification_url}</p>

                <p style="color: #e74c3c; font-weight: bold;">Note: This link is valid for 24 hours only.</p>

                <p>If you did not sign up for StudyHub, please ignore this email.</p>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
                    StudyHub - Platform for sharing study materials<br>
                    This email was sent automatically, please do not reply.
                </p>
            </div>
        </body>
        </html>
        """

        return EmailService.send_email(to_email, subject, html_content)

    @staticmethod
    def send_welcome_email(to_email: str, username: str) -> bool:
        """
        Send welcome email after successful verification.

        Args:
            to_email: User's email address
            username: User's username

        Returns:
            True if email sent successfully, False otherwise
        """
        subject = "Welcome to StudyHub!"

        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f4f4f4; border-radius: 10px; padding: 30px;">
                <h1 style="color: #27ae60; text-align: center;">🎉 Your Account is Verified!</h1>

                <p>Hello {username},</p>

                <p>Your email address has been successfully verified. You can now start using all features of StudyHub:</p>

                <ul style="line-height: 2;">
                    <li>Upload study materials</li>
                    <li>Download shared materials</li>
                    <li>Rate and review materials</li>
                    <li>Participate in discussions</li>
                    <li>Use AI assistant for questions about materials</li>
                </ul>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{settings.FRONTEND_URL}/login"
                       style="background-color: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                        Login Now
                    </a>
                </div>

                <p>Good luck with your studies!</p>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
                    StudyHub - Platform for sharing study materials<br>
                    This email was sent automatically, please do not reply.
                </p>
            </div>
        </body>
        </html>
        """

        return EmailService.send_email(to_email, subject, html_content)

    @staticmethod
    def send_password_reset_email(to_email: str, username: str, reset_token: str) -> bool:
        """
        Send password reset email to user.

        Args:
            to_email: User's email address
            username: User's username
            reset_token: Password reset token

        Returns:
            True if email sent successfully, False otherwise
        """
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

        subject = "Reset your password - StudyHub"

        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f4f4f4; border-radius: 10px; padding: 30px;">
                <h1 style="color: #e67e22; text-align: center;">Reset Your Password</h1>

                <p>Hello {username},</p>

                <p>We received a request to reset your password for your StudyHub account.</p>

                <p>To reset your password, please click the button below:</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}"
                       style="background-color: #e67e22; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                        Reset Password
                    </a>
                </div>

                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #e67e22;">{reset_url}</p>

                <p style="color: #e74c3c; font-weight: bold;">Note: This link is valid for 1 hour only.</p>

                <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
                    StudyHub - Platform for sharing study materials<br>
                    This email was sent automatically, please do not reply.
                </p>
            </div>
        </body>
        </html>
        """

        return EmailService.send_email(to_email, subject, html_content)
