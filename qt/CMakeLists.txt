project(qt)
cmake_minimum_required(VERSION 2.8)
set(CMAKE_VERBOSE_MAKEFILE on)

find_package(Qt5 COMPONENTS Core Widgets REQUIRED)
find_package(PythonLibs 3.2 REQUIRED)


include_directories(${Qt5Core_INCLUDE_DIRS} ${Qt5Widgets_INCLUDE_DIRS})
include_directories(${CMAKE_CURRENT_BINARY_DIR})
include_directories(${PYTHON_INCLUDE_DIRS})

set(CMAKE_CXX_FLAGS "-std=c++11 -fPIC  -Wall -gdwarf-3")
add_definitions(-DQT_NO_KEYWORDS)

set(SOURCES
    main.cpp
    widgets.cpp
)

set(HEADERS
    widgets.h
)

qt5_wrap_cpp(MOCS ${HEADERS})

add_executable(${PROJECT_NAME} ${SOURCES} ${UICS} ${MOCS})
target_link_libraries(${PROJECT_NAME} ${Qt5Core_LIBRARIES} ${Qt5Widgets_LIBRARIES} ${PYTHON_LIBRARIES})
#python_add_module(mod1 mod1.cpp)

