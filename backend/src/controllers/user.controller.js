import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

import { getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/express";

/**
 * Retrieves a user's public profile using their username.
 *
 * Finds the user in MongoDB and returns their profile data.
 * Returns a 404 error when no user matches the provided username.
 *
 * @route GET /api/users/profile/:username
 * @access Public
 * @param {import('express').Request} req - Express request object containing the username parameter.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Returns the user's profile or an error response.
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username });

  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});



/**
 * Updates the profile of the currently authenticated user.
 *
 * Uses the authenticated user's Clerk ID to locate their MongoDB record
 * and applies the profile data provided in the request body. The updated
 * user document is returned after the operation.
 *
 * @route PUT /api/users/profile
 * @access Private
 * @param {import('express').Request} req - Express request object containing updated profile data.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Returns the updated user or an error response.
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  const user = await User.findOneAndUpdate(
    { clerkId: userId },
    req.body,
    { new: true }
  );

  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});



/**
 * Synchronizes the authenticated Clerk user with the MongoDB database.
 *
 * Checks whether the authenticated user already exists in MongoDB. If the
 * user exists, the existing record is returned. Otherwise, the user's data
 * is retrieved from Clerk, transformed into the application's user structure,
 * and stored as a new MongoDB document.
 *
 * @remarks
 * After the user has been authenticated by Clerk, this function will be
 * called to sync the user with the MongoDB database.
 *
 * @route POST /api/users/sync
 * @access Private
 * @param {import('express').Request} req - Express request object containing Clerk authentication data.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Returns the existing or newly created user.
 */
export const syncUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  const existingUser = await User.findOne({ clerkId: userId });

  if (existingUser) {
    return res.status(200).json({
      user: existingUser,
      message: "User already exists",
    });
  }

  const clerkUser = await clerkClient.users.getUser(userId);

  const userData = {
    clerkId: userId,
    email: clerkUser.emailAddresses[0].emailAddress,
    firstName: clerkUser.firstName || "",
    lastName: clerkUser.lastName || "",
    username: clerkUser.emailAddresses[0].emailAddress.split("@")[0],
    profilePicture: clerkUser.imageUrl || "",
  };

  const user = await User.create(userData);

  res.status(201).json({
    user,
    message: "User created successfully",
  });
});



/**
 * Retrieves the profile of the currently authenticated user.
 *
 * Uses the Clerk authentication ID to find the corresponding user
 * in MongoDB and returns their complete user document.
 *
 * @route GET /api/users/me
 * @access Private
 * @param {import('express').Request} req - Express request object containing Clerk authentication data.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Returns the authenticated user's profile.
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const user = await User.findOne({ clerkId: userId });

  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});



/**
 * Follows or unfollows a target user for the currently authenticated user.
 *
 * Determines whether the current user is already following the target user.
 * If they are following the user, both users' follower/following lists are
 * updated to remove the relationship. Otherwise, the relationship is added
 * to both lists and a follow notification is created for the target user.
 * A user cannot follow themselves.
 *
 * @route POST /api/users/follow/:targetUserId
 * @access Private
 * @param {import('express').Request} req - Express request object containing the target user's ID.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Returns a success message describing the action.
 */
export const followUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { targetUserId } = req.params;

  if (userId === targetUserId) {
    return res.status(400).json({
      error: "You cannot follow yourself",
    });
  }

  const currentUser = await User.findOne({ clerkId: userId });
  const targetUser = await User.findById(targetUserId);

  if (!currentUser || !targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const isFollowing = currentUser.following.includes(targetUserId);

  if (isFollowing) {
    await User.findByIdAndUpdate(currentUser._id, {
      $pull: { following: targetUserId },
    });

    await User.findByIdAndUpdate(targetUserId, {
      $pull: { followers: currentUser._id },
    });
  } else {
    await User.findByIdAndUpdate(currentUser._id, {
      $push: { following: targetUserId },
    });

    await User.findByIdAndUpdate(targetUserId, {
      $push: { followers: currentUser._id },
    });

    await Notification.create({
      from: currentUser._id,
      to: targetUserId,
      type: "follow",
    });
  }

  res.status(200).json({
    message: isFollowing
      ? "User unfollowed successfully"
      : "User followed successfully",
  });
});
