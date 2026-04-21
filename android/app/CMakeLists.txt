cmake_minimum_required(VERSION 3.13)

# Define the project name
project(uptula)

# Set the C++ standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include React Native CMake utilities
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)