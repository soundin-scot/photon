#include <csignal>
#include <iostream>
#include "application/Application.h"
#include "application/Config.h"
#include <spdlog/spdlog.h>

static photon::Application* g_app = nullptr;

static void signalHandler(int) {
    if (g_app) g_app->stop();
}

int main(int argc, char* argv[]) {
    spdlog::set_level(spdlog::level::info);
    spdlog::set_pattern("[%H:%M:%S.%e] [%^%l%$] %v");

    auto config = photon::Config::fromArgs(argc, argv);

    photon::Application app;
    g_app = &app;

    std::signal(SIGINT, signalHandler);
    std::signal(SIGTERM, signalHandler);

    spdlog::info("Photon v0.1.0");
    spdlog::info("Starting on port {}...", config.webPort);

    app.start(config);
    app.waitForStop();

    spdlog::info("Photon stopped.");
    return 0;
}
