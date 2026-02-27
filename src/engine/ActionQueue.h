#pragma once
#include <cstdint>
#include <deque>
#include <mutex>
#include <optional>
#include <variant>
#include <vector>

namespace photon {

namespace action {

struct SetChannel {
    uint16_t universe;
    uint16_t channel;
    uint8_t value;
};

struct Blackout {};

} // namespace action

using Action = std::variant<action::SetChannel, action::Blackout>;

template <typename T>
class ActionQueue {
public:
    void push(T action) {
        std::lock_guard lock(mutex_);
        queue_.push_back(std::move(action));
    }

    std::optional<T> pop() {
        std::lock_guard lock(mutex_);
        if (queue_.empty()) return std::nullopt;
        T val = std::move(queue_.front());
        queue_.pop_front();
        return val;
    }

    std::vector<T> drain() {
        std::lock_guard lock(mutex_);
        std::vector<T> result;
        result.reserve(queue_.size());
        while (!queue_.empty()) {
            result.push_back(std::move(queue_.front()));
            queue_.pop_front();
        }
        return result;
    }

    bool empty() const {
        std::lock_guard lock(mutex_);
        return queue_.empty();
    }

private:
    mutable std::mutex mutex_;
    std::deque<T> queue_;
};

} // namespace photon
