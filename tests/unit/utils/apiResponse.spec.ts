import { ApiResponse } from '../../../src/utils/apiResponse';
import { Response } from 'express';

// Mock response object
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('ApiResponse', () => {
  let res: Response;

  beforeEach(() => {
    res = mockResponse();
  });

  describe('constructor and send method', () => {
    it('should create and send basic response', () => {
      const data = { id: 1, name: 'Test' };
      const response = new ApiResponse(res, 200, data, 'Success');
      
      response.send();
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: data
      });
    });

    it('should create response with default message', () => {
      const data = { id: 1 };
      const response = new ApiResponse(res, 201, data);
      
      response.send();
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: data
      });
    });

    it('should create response with null data', () => {
      const response = new ApiResponse(res, 204, null, 'No content');
      
      response.send();
      
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'No content',
        data: null
      });
    });

    it('should include meta data when provided', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const meta = { page: 1, limit: 10, total: 2 };
      const response = new ApiResponse(res, 200, data, 'Success', meta);
      
      response.send();
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: data,
        meta: meta
      });
    });

    it('should set success to false for error status codes', () => {
      const response = new ApiResponse(res, 400, null, 'Bad Request');
      
      response.send();
      
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bad Request',
        data: null
      });
    });

    it('should set success to false for 500 status codes', () => {
      const response = new ApiResponse(res, 500, null, 'Internal Server Error');
      
      response.send();
      
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal Server Error',
        data: null
      });
    });
  });

  describe('static methods', () => {
    describe('success', () => {
      it('should create success response with 200 status', () => {
        const data = { message: 'Operation successful' };
        const response = ApiResponse.success(res, data, 'Custom success message');
        
        expect(response.statusCode).toBe(200);
        expect(response.data).toBe(data);
        expect(response.message).toBe('Custom success message');
      });

      it('should create success response with default message', () => {
        const data = { id: 1 };
        const response = ApiResponse.success(res, data);
        
        expect(response.statusCode).toBe(200);
        expect(response.data).toBe(data);
        expect(response.message).toBe('Success');
      });
    });

    describe('created', () => {
      it('should create created response with 201 status', () => {
        const data = { id: 1, name: 'New resource' };
        const response = ApiResponse.created(res, data, 'Resource created');
        
        expect(response.statusCode).toBe(201);
        expect(response.data).toBe(data);
        expect(response.message).toBe('Resource created');
      });

      it('should create created response with default message', () => {
        const data = { id: 1 };
        const response = ApiResponse.created(res, data);
        
        expect(response.statusCode).toBe(201);
        expect(response.data).toBe(data);
        expect(response.message).toBe('Success');
      });
    });
  });

  describe('complex data types', () => {
    it('should handle arrays', () => {
      const data = [1, 2, 3, 4, 5];
      const response = new ApiResponse(res, 200, data, 'Array data');
      
      response.send();
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Array data',
        data: data
      });
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          id: 1,
          profile: {
            name: 'John',
            settings: {
              theme: 'dark'
            }
          }
        }
      };
      const response = new ApiResponse(res, 200, data, 'Nested object');
      
      response.send();
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Nested object',
        data: data
      });
    });
  });
});
