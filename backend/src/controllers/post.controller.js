import asyncHandler from "express-async-handler";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { getAuth } from "@clerk/express";
import cloudinary from "../config/cloudinary.js";

import Notification from "../models/notification.model.js";
import Comment from "../models/comment.model.js";

/**
 * @description Retrieves all posts in reverse chronological order.
 *
 * Each post is populated with its author's basic profile information.
 * Comments are also populated with the corresponding comment author's
 * profile information.
 *
 * @route GET /api/posts
 * @access Public
 *
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {Promise<void>} Sends a 200 response containing the list of posts.
 */
export const getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });

  res.status(200).json({ posts });
});

/**
 * @description Retrieves a single post by its ID.
 *
 * The post's author and all comment authors are populated with their
 * basic profile information. Returns a 404 response when the requested
 * post does not exist.
 *
 * @route GET /api/posts/:postId
 * @access Public
 *
 * @param {import("express").Request} req - Express request object containing the post ID.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {Promise<void>} Sends a 200 response containing the requested post.
 */
export const getPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId)
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });

  if (!post) return res.status(404).json({ error: "Post not found" });

  res.status(200).json({ post });
});

/**
 * @description Retrieves all posts created by a specific user.
 *
 * The user is located by their username before retrieving their posts.
 * Results are sorted from newest to oldest, with both post authors and
 * comment authors populated with their basic profile information.
 *
 * @route GET /api/posts/user/:username
 * @access Public
 *
 * @param {import("express").Request} req - Express request object containing the username.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {Promise<void>} Sends a 200 response containing the user's posts.
 */
export const getUserPosts = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username });

  if (!user) return res.status(404).json({ error: "User not found" });

  const posts = await Post.find({ user: user._id })
    .sort({ createdAt: -1 })
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });

  res.status(200).json({ posts });
});

/**
 * @description Creates a new post for the currently authenticated user.
 *
 * A post must contain either text content, an image, or both. When an image
 * is provided, it is converted to a base64 data URI and uploaded to Cloudinary
 * under the "social_media_posts" folder. Cloudinary automatically limits the
 * image dimensions and optimizes its quality and format.
 *
 * The authenticated Clerk user is matched with the application's User record
 * before the post is created. The resulting Cloudinary URL is stored with the
 * post.
 *
 * @remarks
 * Requires Clerk authentication middleware and a file-upload middleware such
 * as Multer to run before this controller. The authenticated user is accessed
 * through getAuth(req), while the uploaded image is accessed through req.file.
 *
 * @route POST /api/posts
 * @access Private
 *
 * @param {import("express").Request} req - Express request object containing
 * the post content in req.body.content and an optional image in req.file.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {Promise<void>} Sends a 201 response containing the newly created post.
 */
export const createPost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { content } = req.body;
  const imageFile = req.file;

  if (!content && !imageFile) {
    return res
      .status(400)
      .json({ error: "Post must contain either text or image" });
  }

  const user = await User.findOne({ clerkId: userId });

  if (!user) return res.status(404).json({ error: "User not found" });

  let imageUrl = "";

  if (imageFile) {
    try {
      const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString(
        "base64"
      )}`;

      const uploadResponse = await cloudinary.uploader.upload(base64Image, {
        folder: "social_media_posts",
        resource_type: "image",
        transformation: [
          { width: 800, height: 600, crop: "limit" },
          { quality: "auto" },
          { format: "auto" },
        ],
      });

      imageUrl = uploadResponse.secure_url;
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);

      return res.status(400).json({ error: "Failed to upload image" });
    }
  }

  const post = await Post.create({
    user: user._id,
    content: content || "",
    image: imageUrl,
  });

  res.status(201).json({ post });
});

/**
 * @description Toggles the authenticated user's like on a post.
 *
 * If the user has already liked the post, their like is removed. If they
 * have not liked it, their like is added. When a user likes another user's
 * post, a like notification is also created for the post owner.
 *
 * Users can like their own posts, but liking their own post does not create
 * a notification.
 *
 * @route POST /api/posts/:postId/like
 * @access Private
 *
 * @param {import("express").Request} req - Express request object containing the post ID.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {Promise<void>} Sends a 200 response indicating whether the post
 * was liked or unliked.
 */
export const likePost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  const post = await Post.findById(postId);

  if (!user || !post) {
    return res.status(404).json({ error: "User or post not found" });
  }

  const isLiked = post.likes.includes(user._id);

  if (isLiked) {
    await Post.findByIdAndUpdate(postId, {
      $pull: { likes: user._id },
    });
  } else {
    await Post.findByIdAndUpdate(postId, {
      $push: { likes: user._id },
    });

    if (post.user.toString() !== user._id.toString()) {
      await Notification.create({
        from: user._id,
        to: post.user,
        type: "like",
        post: postId,
      });
    }
  }

  res.status(200).json({
    message: isLiked
      ? "Post unliked successfully"
      : "Post liked successfully",
  });
});



/**
 * @description Deletes a post belonging to the currently authenticated user.
 *
 * The authenticated user must be the original author of the post. Before
 * deleting the post, all comments associated with it are removed to prevent
 * orphaned comment documents from remaining in the database.
 *
 * @route DELETE /api/posts/:postId
 * @access Private
 *
 * @param {import("express").Request} req - Express request object containing the post ID.
 * @param {import("express").Response} res - Express response object.
 *
 * @returns {Promise<void>} Sends a 200 response when the post and its comments
 * have been successfully deleted.
 */
export const deletePost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  const post = await Post.findById(postId);

  if (!user || !post) {
    return res.status(404).json({ error: "User or post not found" });
  }

  if (post.user.toString() !== user._id.toString()) {
    return res
      .status(403)
      .json({ error: "You can only delete your own posts" });
  }

  await Comment.deleteMany({ post: postId });

  await Post.findByIdAndDelete(postId);

  res.status(200).json({ message: "Post deleted successfully" });
});