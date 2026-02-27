#include <catch2/catch_test_macros.hpp>
#include "engine/Universe.h"

using namespace photon;

TEST_CASE("Universe default state is all zeros") {
    Universe u;
    auto output = u.getOutput();
    for (uint16_t i = 0; i < Universe::NUM_CHANNELS; ++i) {
        REQUIRE(output[i] == 0);
    }
}

TEST_CASE("Universe setValue and getOutput") {
    Universe u;
    u.setValue(0, 128, SourcePriority::Programmer);
    u.setValue(1, 255, SourcePriority::Programmer);

    REQUIRE(u.getOutputValue(0) == 128);
    REQUIRE(u.getOutputValue(1) == 255);
    REQUIRE(u.getOutputValue(2) == 0);
}

TEST_CASE("Universe higher priority wins") {
    Universe u;
    u.setValue(0, 100, SourcePriority::Background);
    u.setValue(0, 200, SourcePriority::Scene);
    u.setValue(0, 50, SourcePriority::Programmer);

    // Programmer is highest, should win
    REQUIRE(u.getOutputValue(0) == 50);
}

TEST_CASE("Universe falls back to lower priority when higher cleared") {
    Universe u;
    u.setValue(0, 100, SourcePriority::Scene);
    u.setValue(0, 200, SourcePriority::Programmer);

    REQUIRE(u.getOutputValue(0) == 200);

    u.clearPriority(SourcePriority::Programmer);
    REQUIRE(u.getOutputValue(0) == 100);
}

TEST_CASE("Universe blackout clears everything") {
    Universe u;
    u.setValue(0, 255, SourcePriority::Programmer);
    u.setValue(100, 128, SourcePriority::Scene);
    u.setValue(200, 64, SourcePriority::Background);

    u.blackout();
    auto output = u.getOutput();
    for (uint16_t i = 0; i < Universe::NUM_CHANNELS; ++i) {
        REQUIRE(output[i] == 0);
    }
}

TEST_CASE("Universe dirty flag") {
    Universe u;
    REQUIRE_FALSE(u.isDirty());

    u.setValue(0, 128, SourcePriority::Programmer);
    REQUIRE(u.isDirty());

    u.clearDirty();
    REQUIRE_FALSE(u.isDirty());

    u.blackout();
    REQUIRE(u.isDirty());
}

TEST_CASE("Universe out-of-range channel is ignored") {
    Universe u;
    u.setValue(512, 255, SourcePriority::Programmer);
    REQUIRE(u.getOutputValue(512) == 0);
}
