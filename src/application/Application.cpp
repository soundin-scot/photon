#include "application/Application.h"
#include "relay/RelayClient.h"
#include "protocol/ArtNetSender.h"
#include <spdlog/spdlog.h>
#include <chrono>

namespace photon {

template <class... Ts>
struct overloaded : Ts... { using Ts::operator()...; };
template <class... Ts>
overloaded(Ts...) -> overloaded<Ts...>;

Application::Application() = default;

Application::~Application() {
    stop();
}

void Application::start(const Config& config) {
    if (running_.exchange(true)) return;

    config_ = config;
    mergeBuffer_ = std::make_unique<MergeBuffer>(config.universeCount);
    deviceManager_ = std::make_unique<DeviceManager>();
    outputScheduler_ = std::make_unique<OutputScheduler>(*mergeBuffer_, *deviceManager_);
    wsBroadcaster_ = std::make_unique<WsBroadcaster>(*mergeBuffer_, config.wsBroadcastHz);
    webServer_ = std::make_unique<WebServer>(*mergeBuffer_, actionQueue_,
                                              *deviceManager_, *wsBroadcaster_, config);

    setupDefaultDevices(config);
    outputScheduler_->setRefreshRate(config.outputHz);
    outputScheduler_->start();
    wsBroadcaster_->start();

    // Start relay client if configured
    if (config.hasRelay()) {
        relayClient_ = std::make_unique<RelayClient>(config.relayUrl, config.relayToken, actionQueue_);
        wsBroadcaster_->addObserver(relayClient_.get());
        relayClient_->start();
        spdlog::info("Relay client enabled — connecting to {}", config.relayUrl);
    }

    engineThread_ = std::thread([this] { engineLoop(); });

    webThread_ = std::thread([this] {
        spdlog::info("Web server starting on port {}", config_.webPort);
        webServer_->start();
    });

    spdlog::info("Photon engine running — {} universes, {:.0f} Hz output",
                 config.universeCount, config.outputHz);
}

void Application::stop() {
    if (!running_.exchange(false)) return;

    spdlog::info("Shutting down...");
    if (relayClient_) {
        wsBroadcaster_->removeObserver(relayClient_.get());
        relayClient_->stop();
        relayClient_.reset();
    }
    webServer_->stop();
    wsBroadcaster_->stop();
    outputScheduler_->stop();

    if (engineThread_.joinable()) engineThread_.join();
    if (webThread_.joinable()) webThread_.join();

    deviceManager_->closeAll();
    spdlog::info("Shutdown complete");
}

void Application::waitForStop() {
    if (webThread_.joinable()) webThread_.join();
}

void Application::engineLoop() {
    spdlog::info("Show engine thread started (~100 Hz)");

    while (running_.load()) {
        auto actions = actionQueue_.drain();
        for (auto& action : actions) {
            std::visit(overloaded{
                [this](const action::SetChannel& a) {
                    mergeBuffer_->setValue(a.universe, a.channel, a.value,
                                          SourcePriority::Programmer);
                },
                [this](const action::Blackout&) {
                    mergeBuffer_->blackout();
                    spdlog::info("Blackout executed");
                }
            }, action);
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }

    spdlog::info("Show engine thread stopped");
}

void Application::setupDefaultDevices(const Config& config) {
    auto artnet = std::make_shared<ArtNetSender>(config.artnetTargetIp, config.artnetPort);

    for (uint16_t u = 0; u < config.universeCount; ++u) {
        deviceManager_->addDevice(artnet, u);
    }
}

} // namespace photon
