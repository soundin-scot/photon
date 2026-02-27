#include "web/WebServer.h"
#include <nlohmann/json.hpp>
#include <spdlog/spdlog.h>
#include <filesystem>
#include <fstream>

namespace photon {

using json = nlohmann::json;
namespace fs = std::filesystem;

WebServer::WebServer(MergeBuffer& mergeBuffer, ActionQueue<Action>& actionQueue,
                     DeviceManager& deviceManager, WsBroadcaster& wsBroadcaster,
                     const Config& config)
    : restApi_(mergeBuffer, actionQueue, deviceManager, config),
      wsBroadcaster_(wsBroadcaster), config_(config),
      mergeBuffer_(mergeBuffer), actionQueue_(actionQueue) {}

void WebServer::start() {
    restApi_.registerRoutes(app_);
    setupWebSocket();
    setupStaticFiles();

    app_.loglevel(crow::LogLevel::Warning);
    app_.port(config_.webPort).multithreaded().run();
}

void WebServer::stop() {
    app_.stop();
}

void WebServer::setupWebSocket() {
    CROW_WEBSOCKET_ROUTE(app_, "/ws")
        .onopen([this](crow::websocket::connection& conn) {
            wsBroadcaster_.addConnection(&conn);
        })
        .onclose([this](crow::websocket::connection& conn, const std::string&, uint16_t) {
            wsBroadcaster_.removeConnection(&conn);
        })
        .onmessage([this](crow::websocket::connection&, const std::string& data, bool) {
            try {
                auto msg = json::parse(data);
                std::string type = msg.at("type").get<std::string>();

                if (type == "set_channel") {
                    actionQueue_.push(action::SetChannel{
                        msg.at("universe").get<uint16_t>(),
                        msg.at("channel").get<uint16_t>(),
                        msg.at("value").get<uint8_t>()
                    });
                } else if (type == "set_channels") {
                    uint16_t universe = msg.at("universe").get<uint16_t>();
                    for (auto& pair : msg.at("channels")) {
                        actionQueue_.push(action::SetChannel{
                            universe,
                            pair[0].get<uint16_t>(),
                            pair[1].get<uint8_t>()
                        });
                    }
                } else if (type == "blackout") {
                    actionQueue_.push(action::Blackout{});
                    spdlog::info("Blackout triggered via WebSocket");
                }
            } catch (const std::exception& e) {
                spdlog::warn("Invalid WebSocket message: {}", e.what());
            }
        });
}

void WebServer::setupStaticFiles() {
    if (config_.frontendDir.empty()) return;

    fs::path frontendPath(config_.frontendDir);
    if (!fs::exists(frontendPath)) {
        spdlog::warn("Frontend directory not found: {}", config_.frontendDir);
        return;
    }

    spdlog::info("Serving frontend from: {}", config_.frontendDir);

    CROW_CATCHALL_ROUTE(app_)
    ([this](const crow::request& req) -> crow::response {
        fs::path frontendPath(config_.frontendDir);
        std::string urlPath = req.url;

        if (urlPath == "/") urlPath = "/index.html";

        fs::path filePath = frontendPath / urlPath.substr(1);

        if (fs::exists(filePath) && fs::is_regular_file(filePath)) {
            std::ifstream file(filePath, std::ios::binary);
            std::string content((std::istreambuf_iterator<char>(file)),
                                std::istreambuf_iterator<char>());

            crow::response res(200, content);
            std::string ext = filePath.extension().string();
            if (ext == ".html") res.set_header("Content-Type", "text/html; charset=utf-8");
            else if (ext == ".js") res.set_header("Content-Type", "application/javascript");
            else if (ext == ".css") res.set_header("Content-Type", "text/css");
            else if (ext == ".json") res.set_header("Content-Type", "application/json");
            else if (ext == ".svg") res.set_header("Content-Type", "image/svg+xml");
            else if (ext == ".png") res.set_header("Content-Type", "image/png");
            else if (ext == ".ico") res.set_header("Content-Type", "image/x-icon");
            else if (ext == ".woff2") res.set_header("Content-Type", "font/woff2");
            return res;
        }

        // SPA fallback: serve index.html for unmatched routes
        fs::path indexPath = frontendPath / "index.html";
        if (fs::exists(indexPath)) {
            std::ifstream file(indexPath, std::ios::binary);
            std::string content((std::istreambuf_iterator<char>(file)),
                                std::istreambuf_iterator<char>());
            crow::response res(200, content);
            res.set_header("Content-Type", "text/html; charset=utf-8");
            return res;
        }

        return crow::response(404);
    });
}

} // namespace photon
