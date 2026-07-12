const Department = require("../models/Department");
const AssetCategory = require("../models/AssetCategory");
const { departmentSchema, assetCategorySchema } = require("../utils/validation");

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({})
      .populate("head", "name email role")
      .populate("parentDept", "name")
      .sort({ name: 1 });
    return res.json(departments);
  } catch (error) {
    console.error("Get Departments Error:", error);
    return res.status(500).json({ message: "Server error fetching departments" });
  }
};

const createDepartment = async (req, res) => {
  try {
    const result = departmentSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => e.message);
      return res.status(400).json({ message: errors.join(". ") });
    }

    const { name, description, head, parentDept, status } = result.data;

    const existing = await Department.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: `Department "${name}" already exists` });
    }

    const dept = await Department.create({
      name,
      description,
      head: head || null,
      parentDept: parentDept || null,
      status,
    });

    const populated = await Department.findById(dept._id)
      .populate("head", "name email role")
      .populate("parentDept", "name");

    return res.status(201).json({ message: "Department created successfully", department: populated });
  } catch (error) {
    console.error("Create Department Error:", error);
    return res.status(500).json({ message: "Server error creating department" });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const result = departmentSchema.partial().safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => e.message);
      return res.status(400).json({ message: errors.join(". ") });
    }

    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: "Department not found" });

    const { name, description, head, parentDept, status } = result.data;

    if (name && name !== dept.name) {
      const nameConflict = await Department.findOne({ name: name.trim() });
      if (nameConflict) {
        return res.status(400).json({ message: `Department name "${name}" is already taken` });
      }
    }

    if (name !== undefined) dept.name = name;
    if (description !== undefined) dept.description = description;
    if (head !== undefined) dept.head = head || null;
    if (parentDept !== undefined) dept.parentDept = parentDept || null;
    if (status !== undefined) dept.status = status;

    await dept.save();

    const updated = await Department.findById(dept._id)
      .populate("head", "name email role")
      .populate("parentDept", "name");

    return res.json({ message: "Department updated successfully", department: updated });
  } catch (error) {
    console.error("Update Department Error:", error);
    return res.status(500).json({ message: "Server error updating department" });
  }
};

const deactivateDepartment = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: "Department not found" });

    dept.status = "Inactive";
    await dept.save();

    return res.json({ message: `Department "${dept.name}" has been deactivated` });
  } catch (error) {
    console.error("Deactivate Department Error:", error);
    return res.status(500).json({ message: "Server error deactivating department" });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await AssetCategory.find({}).sort({ name: 1 });
    return res.json(categories);
  } catch (error) {
    console.error("Get Categories Error:", error);
    return res.status(500).json({ message: "Server error fetching categories" });
  }
};

const createCategory = async (req, res) => {
  try {
    const result = assetCategorySchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => e.message);
      return res.status(400).json({ message: errors.join(". ") });
    }

    const { name, description, customFields, status } = result.data;

    const existing = await AssetCategory.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: `Category "${name}" already exists` });
    }

    const category = await AssetCategory.create({ name, description, customFields, status });
    return res.status(201).json({ message: "Asset category created successfully", category });
  } catch (error) {
    console.error("Create Category Error:", error);
    return res.status(500).json({ message: "Server error creating category" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const result = assetCategorySchema.partial().safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => e.message);
      return res.status(400).json({ message: errors.join(". ") });
    }

    const category = await AssetCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const { name, description, customFields, status } = result.data;

    if (name && name !== category.name) {
      const nameConflict = await AssetCategory.findOne({ name: name.trim() });
      if (nameConflict) {
        return res.status(400).json({ message: `Category name "${name}" is already taken` });
      }
    }

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (customFields !== undefined) category.customFields = customFields;
    if (status !== undefined) category.status = status;

    await category.save();
    return res.json({ message: "Category updated successfully", category });
  } catch (error) {
    console.error("Update Category Error:", error);
    return res.status(500).json({ message: "Server error updating category" });
  }
};

const deactivateCategory = async (req, res) => {
  try {
    const category = await AssetCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    category.status = "Inactive";
    await category.save();

    return res.json({ message: `Category "${category.name}" has been deactivated` });
  } catch (error) {
    console.error("Deactivate Category Error:", error);
    return res.status(500).json({ message: "Server error deactivating category" });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deactivateDepartment,
  getCategories,
  createCategory,
  updateCategory,
  deactivateCategory,
};
