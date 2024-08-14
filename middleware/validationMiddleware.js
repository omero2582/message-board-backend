import { validationResult } from "express-validator";
import { ValidationError } from "../errors/errors.js";
import asyncHandler from 'express-async-handler';

// Returns errors in {errors: [ {} ]}
const checkValidationErrorsArray = asyncHandler( async (req, res, next) =>{
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation Error', {errors: errors.array()});
  }
  next();
});

// Returns errors in {errors: { firsName: {} }}
export const checkValidationErrorsObjKeys = asyncHandler( async (req, res, next) =>{
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation Error', {errors: errors.mapped()});
  }
  next();
});

// Returns errors in {errors: { firsName: [] }}
const checkValidationErrorsObjKeysArray = asyncHandler( async (req, res, next) =>{
  const errorsRaw = validationResult(req);
  const errors = errorsRaw.array().reduce((sum, cur) => {
    if(!sum[cur.path]){
      sum[cur.path] = [];
    }
    sum[cur.path].push(cur)
    return sum;
  }, {})

  if (!errorsRaw.isEmpty()) {
    throw new ValidationError('Validation Error', {errors});
  }
  next();
});
