add_executable(photon_tests
    test_universe.cpp
    test_merge_buffer.cpp
    test_artnet.cpp
)

target_link_libraries(photon_tests PRIVATE
    photon_lib
    Catch2::Catch2WithMain
)

include(CTest)
include(Catch)
catch_discover_tests(photon_tests)
