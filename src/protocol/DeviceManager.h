#pragma once
#include <cstdint>
#include <memory>
#include <shared_mutex>
#include <string>
#include <vector>
#include "protocol/OutputDevice.h"

namespace photon {

struct DeviceAssignment {
    std::string id;
    std::shared_ptr<OutputDevice> device;
    uint16_t universe;
};

class DeviceManager {
public:
    std::string addDevice(std::shared_ptr<OutputDevice> device, uint16_t universe);
    void removeDevice(const std::string& id);

    std::vector<std::shared_ptr<OutputDevice>> getDevicesForUniverse(uint16_t universe) const;
    std::vector<DeviceAssignment> getAllDevices() const;

    void openAll();
    void closeAll();

private:
    mutable std::shared_mutex mutex_;
    std::vector<DeviceAssignment> devices_;
    uint32_t nextId_{1};
};

} // namespace photon
