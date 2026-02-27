#include <catch2/catch_test_macros.hpp>
#include "protocol/ArtNetSender.h"
#include <cstring>

using namespace photon;

TEST_CASE("ArtNetSender construction with defaults") {
    ArtNetSender sender;
    REQUIRE(sender.getTypeName() == "Art-Net");
    REQUIRE(sender.getDescription() == "Art-Net to 255.255.255.255:6454");
    REQUIRE_FALSE(sender.isOpen());
}

TEST_CASE("ArtNetSender construction with custom params") {
    ArtNetSender sender("10.0.0.1", 6455);
    REQUIRE(sender.getDescription() == "Art-Net to 10.0.0.1:6455");
    REQUIRE(sender.getTargetIp() == "10.0.0.1");
    REQUIRE(sender.getPort() == 6455);
}

TEST_CASE("ArtNetSender open and close") {
    ArtNetSender sender("127.0.0.1");
    REQUIRE(sender.open());
    REQUIRE(sender.isOpen());
    sender.close();
    REQUIRE_FALSE(sender.isOpen());
}

TEST_CASE("ArtNetSender send does not crash on closed socket") {
    ArtNetSender sender;
    std::array<uint8_t, 512> data{};
    data[0] = 255;
    // Should silently do nothing
    sender.send(0, data);
}

TEST_CASE("ArtNetSender send to loopback") {
    ArtNetSender sender("127.0.0.1");
    REQUIRE(sender.open());

    std::array<uint8_t, 512> data{};
    data[0] = 255;
    data[511] = 128;
    // Should not throw
    sender.send(0, data);
    sender.send(1, data);
    sender.close();
}
