class APIFeatures {
  //mongoose query and queryStr fron Express
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }
  filter() {
    const queryObj = { ...this.queryStr }; //simply create new object
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // console.log(JSON.parse(queryStr));

    this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    console.log('1111', this.queryStr);
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.query.fields.split(',').join('');
      this.query = this.query.select(fields); //projecting operaning
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }
  paging() {
    const page = +this.queryStr.pagge || 1;
    const limit = +this.queryStr.limit || 100;
    const skip = (page - 1) * limit;
    //page=2&limit=10 ==>1-10 for page #1 and 11-20 for page #2
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
module.exports = APIFeatures;
