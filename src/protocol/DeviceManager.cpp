#include "protocol/DeviceManager.h"
#include <spdlog/spdlog.h>
#include <algorithm>

namespace photon {

std::string DeviceManager::addDevice(std::shared_ptr<OutputDevice> device, uint16_t universe) {
    std::unique_lock lock(mutex_);
    std::string id = "dev_" + std::to_string(nextId_++);

    if (device->open()) {
        spdlog::info("Device added: {} [{}] on universe {}", id, device->getDescription(), universe);
    } else {
        spdlog::warn("Device {} failed to open: {}", id, device->getDescription());
    }

    devices_.push_back({id, std::move(device), universe});
    return id;
}

void DeviceManager::removeDevice(const std::string& id) {
    std::unique_lock lock(mutex_);
    auto it = std::find_if(devices_.begin(), devices_.end(),
                           [&](const DeviceAssignment& d) { return d.id == id; });
    if (it != devices_.end()) {
        it->device->close();
        spdlog::info("Device removed: {}", id);
        devices_.erase(it);
    }
}

std::vector<std::shared_ptr<OutputDevice>> DeviceManager::getDevicesForUniverse(uint16_t universe) const {
    std::shared_lock lock(mutex_);
    std::vector<std::shared_ptr<OutputDevice>> result;
    for (const auto& d : devices_) {
        if (d.universe == universe) {
            result.push_back(d.device);
        }
    }
    return result;
}

std::vector<DeviceAssignment> DeviceManager::getAllDevices() const {
    std::shared_lock lock(mutex_);
    return devices_;
}

void DeviceManager::openAll() {
    std::shared_lock lock(mutex_);
    for (auto& d : devices_) d.device->open();
}

void DeviceManager::closeAll() {
    std::shared_lock lock(mutex_);
    for (auto& d : devices_) d.device->close();
}

} // namespace photon
