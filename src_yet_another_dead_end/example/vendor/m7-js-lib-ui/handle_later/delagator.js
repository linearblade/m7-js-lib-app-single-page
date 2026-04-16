/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

export function make(lib) {
    // Event storage, to keep track of added delegators
    let events = [];

    // Helper function to find existing delegators
    function findDelegator(selector, eventType) {
        return events.find(function (delegator) {
            return delegator.selector === selector && delegator.eventType === eventType;
        });
    }

    // Set a delegator: Adds a new delegator or modifies an existing one
    function setDelegator(eventType, selector, handler) {
        // Remove any existing delegator for the same selector and event type
        removeDelegator(eventType, selector);

        // Add the new event listener using event delegation
        const delegator = function (e) {
            const targetElement = e.target.closest(selector);
            if (targetElement) {
                handler.call(targetElement, e);
            }
        };

        // Store the delegator details
        events.push({
            eventType: eventType,
            selector: selector,
            handler: delegator
        });

        // Attach the event listener to the document
        document.addEventListener(eventType, delegator);
    }

    // Remove a delegator: Detaches the event listener
    function removeDelegator(eventType, selector) {
        const existingDelegator = findDelegator(selector, eventType);
        if (existingDelegator) {
            // Remove the event listener from the document
            document.removeEventListener(eventType, existingDelegator.handler);

            // Remove the delegator from the events list
            events = events.filter(function (delegator) {
                return !(delegator.selector === selector && delegator.eventType === eventType);
            });
        }
    }

    // List all active delegators
    function listDelegators() {
        return events.map(function (delegator) {
            return {
                eventType: delegator.eventType,
                selector: delegator.selector
            };
        });
    }

    // Clear all delegators
    function clearDelegators() {
        events.forEach(function (delegator) {
            document.removeEventListener(delegator.eventType, delegator.handler);
        });
        events = [];
    }

    // Public API
    let dispatch = {
        set: setDelegator,
        remove: removeDelegator,
        list: listDelegators,
        clear: clearDelegators
    };

    return dispatch;
}

export default make;
