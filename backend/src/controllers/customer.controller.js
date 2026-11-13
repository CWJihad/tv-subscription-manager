const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const { customerService, paymentService } = require("../services");

const listCustomers = catchAsync(async (req, res) => {
  const data = await customerService.listCustomers(req.query);
  res.status(httpStatus.OK).json(
    response({ message: "Customers", statusCode: httpStatus.OK, type: "customer", data })
  );
});

const getCustomerStats = catchAsync(async (req, res) => {
  const data = await customerService.getCustomerStats(req.query);
  res.status(httpStatus.OK).json(
    response({ message: "Customer stats", statusCode: httpStatus.OK, type: "customer", data })
  );
});

const getCustomer = catchAsync(async (req, res) => {
  const data = await customerService.getCustomerById(req.params.id);
  res.status(httpStatus.OK).json(
    response({ message: "Customer", statusCode: httpStatus.OK, type: "customer", data })
  );
});

const createCustomer = catchAsync(async (req, res) => {
  const data = await customerService.createCustomer(req.body);
  res.status(httpStatus.CREATED).json(
    response({ message: "Customer created", statusCode: httpStatus.CREATED, type: "customer", data })
  );
});

const updateCustomer = catchAsync(async (req, res) => {
  const data = await customerService.updateCustomer(req.params.id, req.body);
  res.status(httpStatus.OK).json(
    response({ message: "Customer updated", statusCode: httpStatus.OK, type: "customer", data })
  );
});

const renewCustomer = catchAsync(async (req, res) => {
  const data = await customerService.renewCustomer(req.params.id, req.body);
  res.status(httpStatus.OK).json(
    response({ message: "Customer renewed", statusCode: httpStatus.OK, type: "customer", data })
  );
});

const upsertRenewalPayment = catchAsync(async (req, res) => {
  const data = await paymentService.upsertPayment(req.params.id, req.params.renewalId, req.body);
  res.status(httpStatus.OK).json(
    response({ message: "Payment saved", statusCode: httpStatus.OK, type: "renewal", data })
  );
});

const deleteCustomer = catchAsync(async (req, res) => {
  const data = await customerService.deleteCustomer(req.params.id);
  res.status(httpStatus.OK).json(
    response({ message: "Customer deleted", statusCode: httpStatus.OK, type: "customer", data })
  );
});

module.exports = {
  listCustomers,
  getCustomerStats,
  getCustomer,
  createCustomer,
  updateCustomer,
  renewCustomer,
  upsertRenewalPayment,
  deleteCustomer,
};