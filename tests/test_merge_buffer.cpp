#include <catch2/catch_test_macros.hpp>
#include "engine/MergeBuffer.h"

using namespace photon;

TEST_CASE("MergeBuffer creates correct number of universes") {
    MergeBuffer mb(8);
    REQUIRE(mb.getUniverseCount() == 8);
}

TEST_CASE("MergeBuffer default output is all zeros") {
    MergeBuffer mb(2);
    auto output = mb.getOutput(0);
    for (auto v : output) REQUIRE(v == 0);
}

TEST_CASE("MergeBuffer setValue on different universes") {
    MergeBuffer mb(4);
    mb.setValue(0, 0, 100, SourcePriority::Programmer);
    mb.setValue(1, 0, 200, SourcePriority::Programmer);

    REQUIRE(mb.getOutput(0)[0] == 100);
    REQUIRE(mb.getOutput(1)[0] == 200);
    REQUIRE(mb.getOutput(2)[0] == 0);
}

TEST_CASE("MergeBuffer blackout clears all universes") {
    MergeBuffer mb(2);
    mb.setValue(0, 0, 255, SourcePriority::Programmer);
    mb.setValue(1, 50, 128, SourcePriority::Programmer);

    mb.blackout();

    REQUIRE(mb.getOutput(0)[0] == 0);
    REQUIRE(mb.getOutput(1)[50] == 0);
}

TEST_CASE("MergeBuffer tryGetOutput") {
    MergeBuffer mb(1);
    mb.setValue(0, 10, 42, SourcePriority::Programmer);

    std::array<uint8_t, 512> out{};
    bool success = mb.tryGetOutput(0, out);
    REQUIRE(success);
    REQUIRE(out[10] == 42);
}

TEST_CASE("MergeBuffer dirty tracking") {
    MergeBuffer mb(2);
    REQUIRE_FALSE(mb.isUniverseDirty(0));

    mb.setValue(0, 0, 128, SourcePriority::Programmer);
    REQUIRE(mb.isUniverseDirty(0));
    REQUIRE_FALSE(mb.isUniverseDirty(1));

    mb.clearUniverseDirty(0);
    REQUIRE_FALSE(mb.isUniverseDirty(0));
}

TEST_CASE("MergeBuffer out-of-range universe returns zeros") {
    MergeBuffer mb(2);
    auto output = mb.getOutput(99);
    for (auto v : output) REQUIRE(v == 0);
}
