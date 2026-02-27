find_program(NPM_EXECUTABLE npm)

if(NPM_EXECUTABLE)
    add_custom_target(frontend
        COMMAND ${NPM_EXECUTABLE} install
        COMMAND ${NPM_EXECUTABLE} run build
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}/frontend
        COMMENT "Building frontend..."
    )
    add_dependencies(photon frontend)

    target_compile_definitions(photon_lib PUBLIC
        PHOTON_FRONTEND_DIR="${CMAKE_SOURCE_DIR}/frontend/dist"
    )
else()
    message(WARNING "npm not found — frontend will not be built")
    target_compile_definitions(photon_lib PUBLIC
        PHOTON_FRONTEND_DIR=""
    )
endif()
