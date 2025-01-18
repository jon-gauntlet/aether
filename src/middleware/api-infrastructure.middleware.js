import { ApiManager } from '../api/infrastructure/api-manager';

const apiManager = new ApiManager();

export const apiInfrastructureMiddleware = async (req, res, next) => {
    await apiManager.handleRequest(req, res, next);
};

export const apiResponseMiddleware = async (req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
        return apiManager.handleResponse(req, res, data);
    };
    next();
}; 