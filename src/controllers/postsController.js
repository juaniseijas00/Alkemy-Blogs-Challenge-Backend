const postManager = require('../utils/postManager');
const withoutError = require('../utils/withoutError');
const db = require('../db');
const { validationResult } = require('express-validator');
const Boom = require('@hapi/boom');

async function getPosts(req, res) {
  const options = {
    include: [
      {
        model: db.category,
        as: 'category',
      },
    ],
  };
  const posts = await postManager.getAllData(db.posts, options);

  if (posts) {
    withoutError(res, 'All posts', posts);
  }
}

async function getPost(req, res) {
  const { id } = req.params;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = Boom.badRequest();
    error.output.payload.details = errors.array();

    throw error;
  }

  const options = {
    where: { id },
    include: [
      {
        model: db.category,
        as: 'category',
      },
    ],
  };

  const post = await postManager.getOneData(db.posts, options);

  withoutError(res, `Post ID: ${id}`, post);
}

async function createPost(req, res, next) {
  const { title, content, image, category } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = Boom.badRequest();
    error.output.payload.details = errors.array();
    throw error;
  }

  const post = {
    title,
    content,
    image,
    categoryID: category,
  };

  const postCreated = await postManager.createItem(db.posts, post, 201);

  if (postCreated) {
    withoutError(res, 'Post created succesfuly', {
      created: true,
      data: postCreated,
    });
  } else {
    withoutError(
      res,
      'The post couldnt be created, Contact a Administrator',
      { created: false, data: null },
      200
    );
  }
}

async function editPost(req, res) {
  const { id } = req.params;
  const { title, content, image, category } = req.body;

  const errors = validationResult(req).array();

  if (errors.length > 0) {
    const error = [];
    const errorId = [];
    errors.map((err) => {
      error.push(err.msg);
    });

    throw Boom.badData(error);
  }

  const categoryExist = await postManager.createIfNoExist(
    db.category,
    { name: category },
    { name: category }
  );

  const post = {
    title,
    content,
    image,
    categoryID: categoryExist.data.id,
  };

  const options = { where: { id } };

  const editedItem = await postManager.editData(db.posts, post, options);

  if (editedItem) {
    withoutError(res, 'Post edited succesfuly', { edited: true });
  } else {
    withoutError(res, 'Post doesnt exist', { edited: false }, 404);
  }
}

async function deletePost(req, res) {
  const { id } = req.params;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = Boom.badRequest();
    error.output.payload.details = errors.array();

    throw error;
  }

  const options = {
    where: {
      id,
    },
  };

  const deletedItem = await postManager.deleteData(db.posts, options);

  if (deletedItem) {
    withoutError(res, 'Post deleted succesfuly', { deleted: true });
  } else {
    // DEVUELVO QUE NO EXISTE EL POST
    withoutError(res, 'Post doesnt exist', { deleted: false }, 404);
  }
}

module.exports = {
  getPosts,
  getPost,
  createPost,
  deletePost,
  editPost,
};