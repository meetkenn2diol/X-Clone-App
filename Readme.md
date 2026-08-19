/(backend)
1. https://arcjet.com to set up the project
2. https://console.cloudinary.com/app set up a new api key for x-clone-app
3. https://cloud.mongodb.com set up a new project in mongoDB
-  add the mongodb uri to the .env file AND  modify it to include the name of the database: ...158j07f.mongodb.net/x_clone_db?appName=xclo...
- change the network access on the mongodb site
4. config/env.js to access all the environment variables.
5. config/db.js to connect to mongoDB
6. backend/models/user.model.js
7. backend/models/post.route.js
8. backend/models/comment.route.js
9. backend/models/notification.model.js
10. > npm install express-async-handler
--- is a small utility that wraps your async route handlers so any thrown error (or rejected promise) automatically gets passed to Express's error-handling middleware via next(error) 
11.  > npm install multer
--- multer is Express middleware for handling multipart/form-data — the format used for file uploads via HTML/native forms. 
12.  > npm install cloudinary 
--- for storing media assets