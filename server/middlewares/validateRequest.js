const validateRequest = (validator) => {
  return (req, _res, next) => {
    try {
      req.validatedBody = validator(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validateRequest;

export const validateParams = (validator) => {
  return (req, _res, next) => {
    try {
      req.validatedParams = validator(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
};
