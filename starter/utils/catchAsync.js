//CATCH ERROR FROM ASYNC FUNCTION(CATCH ASYNC FUNCTION)
module.exports = (fn) => {
  return (req, res, next) => {
    //".catch(next)" it is the same is "catch((err) => next(err)"
    return fn(req, res, next).catch(next);
  };
};
