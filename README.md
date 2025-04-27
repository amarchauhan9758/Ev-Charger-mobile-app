## EV Charger Mobile App

Objective
Build the home screen of a mobile application for the EV Charger infrastructure company.

## Description

Features
Current Location: The app requests location permissions from the user and uses the device's GPS to determine the current location. The location is displayed on a map as a pink marker.

EV Charger Locations: The app uses data from the chargers.json file located in the assets folder to show the locations of available EV chargers. Each charger is represented by a marker on the map.

Floating Action Button (FAB): A Floating Action Button (FAB) is implemented. When pressed:

It captures a screenshot of the visible map section in .webp format.

Uploads the captured screenshot to Google Drive.

Note: You will need to authenticate using Google OAuth to upload the screenshot to Google Drive.

Technologies Used
React Native: Framework used for building the mobile app.

Expo: Used for location services and OAuth authentication.

Google Drive API: For uploading the screenshot to Google Drive.

react-native-maps: For displaying the map with charger locations and the user’s current location.

react-native-view-shot: For capturing the screenshot of the map.

Setup Instructions

## 1. Install Dependencies

First, make sure to install the necessary dependencies:

bash
Copy
Edit
npm install

## 2. Run the App

Start the development server and open the app on an emulator or physical device.

To start the development server:

npm start
To run the app on Android:

npm run android
To run the app on iOS:

npm run ios

## 3. Google Drive API Integration

The app requires OAuth authentication to upload files to Google Drive. To enable this functionality, follow these steps:

## 4. Build for Production

To build the app for Android:

npm run build:android
To build the app for iOS:

npm run build:ios
To create a release APK for Android:

bash

cd android && ./gradlew assembleRelease

## Folder Structure

assets/chargers.json: Contains the charger data used in the app.

components/FAB.js: Contains the Floating Action Button component.

## Preview
![WhatsApp Image 2025-04-28 at 00 17 47](https://github.com/user-attachments/assets/529303ed-44c5-4765-a52a-bb8ba539a889)

##link 
https://expo.dev/artifacts/eas/8vFCWVsi4U7pzMDQRg6exu.apk
