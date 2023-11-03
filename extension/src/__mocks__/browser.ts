import { jest } from "@jest/globals";

const mockBrowser = {
    // Define mock implementations for browser APIs you use
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
        },
    },
    i18n: {
        getMessage: jest.fn(),
    },
    // Add more mock APIs as needed
};

export default mockBrowser;
