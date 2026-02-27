cmake_minimum_required(VERSION 3.20)
project(photon VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

include(cmake/Dependencies.cmake)

add_library(photon_lib STATIC
    src/engine/Universe.cpp
    src/engine/MergeBuffer.cpp
    src/engine/OutputScheduler.cpp
    src/protocol/ArtNetSender.cpp
    src/protocol/DeviceManager.cpp
    src/web/WebServer.cpp
    src/web/RestApi.cpp
    src/web/WsBroadcaster.cpp
    src/relay/RelayClient.cpp
    src/application/Application.cpp
    src/application/Config.cpp
)

target_include_directories(photon_lib PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/src)
target_link_libraries(photon_lib PUBLIC
    Crow::Crow
    nlohmann_json::nlohmann_json
    spdlog::spdlog
    ixwebsocket::ixwebsocket
)

if(WIN32)
    target_link_libraries(photon_lib PUBLIC ws2_32)
endif()

add_executable(photon src/main.cpp)
target_link_libraries(photon PRIVATE photon_lib)

option(PHOTON_BUILD_TESTS "Build tests" ON)
if(PHOTON_BUILD_TESTS)
    enable_testing()
    add_subdirectory(tests)
endif()

option(PHOTON_BUILD_FRONTEND "Build frontend" ON)
if(PHOTON_BUILD_FRONTEND)
    include(cmake/EmbedFrontend.cmake)
endif()
