require("dotenv").config();
const express = require("express");
const { IgApiClient } = require("instagram-private-api");
const { get } = require("request-promise");
const { CronJob } = require("cron");  // ✅ Fixed import
const fs = require("fs").promises;
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const port = process.env.PORT || 4000;

// Start Express Server
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});

/**
 * 📌 Function to Post Instagram Reel Automatically
 */
const postReelToInsta = async (videoURL) => {
  try {
    const ig = new IgApiClient();
    ig.state.generateDevice(process.env.IG_USERNAME);
    
    console.log("⏳ Logging into Instagram...");
    await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
    console.log("✅ Logged into Instagram");

    // Step 1: Download Video
    const videoPath = "./videos/raw_video.mp4";
    console.log(`⏳ Downloading video from: ${videoURL}`);
    const videoBuffer = await get({ url: videoURL, encoding: null });
    await fs.writeFile(videoPath, videoBuffer);
    console.log("✅ Video downloaded successfully:", videoPath);

    // Step 2: Convert Video to Instagram Format
    const convertedVideoPath = "./videos/converted_video.mp4";
    console.log("⏳ Converting video to Instagram format...");

    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(convertedVideoPath)
        .outputOptions([
          "-vf scale=1080:1920", // Set video resolution
          "-preset slow", // High-quality encoding
          "-c:v libx264", // Use H.264 codec
          "-b:v 3500k", // Set bitrate
          "-c:a aac", // Audio codec
          "-b:a 128k", // Audio bitrate
        ])
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    console.log("✅ Video converted successfully:", convertedVideoPath);

    // Step 3: Upload Reel to Instagram
    const videoData = await fs.readFile(convertedVideoPath);
    console.log("⏳ Uploading Reel...");
    
    await ig.publish.video({
      video: videoData,
      caption: "🔥 Check out my latest Reel! 🚀 #Trending",
      coverImage: null,
    });

    console.log("✅ Reel posted successfully!");

    // Step 4: Clean up temporary files
    await fs.unlink(videoPath);
    await fs.unlink(convertedVideoPath);
    console.log("🗑️ Temporary video files deleted.");
  } catch (error) {
    console.error("❌ Error posting Reel:", error.message);
  }
};

/**
 * 📌 Schedule the Posting (Runs Every Hour at Minute 18)
 */
const cronReel = new CronJob("35 * * * *", async () => {
  console.log("⏳ Executing scheduled job...");
  try {
    const userProvidedURL = "https://samplelib.com/lib/preview/mp4/sample-5s.mp4"; // Replace with actual user input
    await postReelToInsta(userProvidedURL);
  } catch (err) {
    console.error("❌ Cron job error:", err.message);
  }
});

cronReel.start();
console.log("✅ Cron job started, Reel will be posted at minute 18 of every hour.");




// require("dotenv").config();
// const express = require("express");
// const { IgApiClient } = require("instagram-private-api");
// const { get } = require("request-promise");
// const CronJob = require("cron").CronJob;
// const fs = require("fs").promises;

// const app = express();
// const port = process.env.PORT || 4000;

// // Start Express Server
// app.listen(port, () => {
//   console.log(`✅ Server running on port ${port}`);
// });

// /**
//  * 📌 Function to Post Instagram Reel Automatically
//  */
// const postReelToInsta = async () => {
//   try {
//     const ig = new IgApiClient();
//     ig.state.generateDevice(process.env.IG_USERNAME);
    
//     console.log("⏳ Logging into Instagram...");
//     await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
//     console.log("✅ Logged into Instagram");

//     // Step 1: Download Video from URL
//     const videoURL = "https://samplelib.com/lib/preview/mp4/sample-15s.mp4"; // Change the video link
//     const videoPath = "./videos/temp_video.mp4";

//     console.log(`⏳ Downloading video from: ${videoURL}`);
//     const videoBuffer = await get({ url: videoURL, encoding: null });
    
//     await fs.writeFile(videoPath, videoBuffer);
//     console.log("✅ Video downloaded successfully:", videoPath);

//     // Step 2: Read the Video File Before Uploading
//     const fileStats = await fs.stat(videoPath).catch(() => null);
//     if (!fileStats || fileStats.size === 0) {
//       console.error("❌ Error: Video file is empty or missing!");
//       return;
//     }
//     console.log(`✅ Video file ready (Size: ${fileStats.size} bytes)`);

//     const videoData = await fs.readFile(videoPath);

//     // Step 3: Upload Reel to Instagram
//     console.log("⏳ Uploading Reel...");
//     await ig.publish.video({
//       video: videoData,
//       caption: "🔥 Check out my latest Reel! 🚀 #Trending", // Change the caption as needed
//       coverImage: null, // Optional: Add a cover image
//     });

//     console.log("✅ Reel posted successfully!");

//     // Step 4: Delete the Video File After Upload
//     await fs.unlink(videoPath);
//     console.log("🗑️ Temporary video file deleted.");
//   } catch (error) {
//     console.error("❌ Error posting Reel:", error.message);
//   }
// };

// /**
//  * 📌 Schedule the Posting (Runs Every Hour at Minute 13)
//  */
// const cronReel = new CronJob("18 * * * *", async () => {
//   console.log("⏳ Executing scheduled job...");
//   try {
//     await postReelToInsta();
//   } catch (err) {
//     console.error("❌ Cron job error:", err.message);
//   }
// });

// cronReel.start();
// console.log("✅ Cron job started, Reel will be posted at minute 13 of every hour.");
