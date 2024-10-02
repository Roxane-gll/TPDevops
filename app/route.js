import * as formValidator from './form_validator.js';
import * as photoModel from './photo_model.js';
import * as queue from './queue.js';
import { getFile } from './listenForMessage.js';

function route(app) {
  app.get('/', (req, res) => {
    const tags = req.query.tags;
    const tagmode = req.query.tagmode;
    const fromPost = req.query.afterPost;

    const ejsLocalVariables = {
      tagsParameter: tags || '',
      tagmodeParameter: tagmode || '',
      photos: [],
      searchResults: false,
      invalidParameters: false
    };

    // if no input params are passed in then render the view with out querying the api
    if (!tags && !tagmode) {
      return res.render('index', ejsLocalVariables);
    }

    // validate query parameters
    if (!formValidator.hasValidFlickrAPIParams(tags, tagmode)) {
      ejsLocalVariables.invalidParameters = true;
      return res.render('index', ejsLocalVariables);
    }

    if (fromPost) {
      getFile().then(async url => {
        return res.redirect(url)
      });
    }

    // get photos from flickr public feed api
    return photoModel
      .getFlickrPhotos(tags, tagmode)
      .then(photos => {
        ejsLocalVariables.photos = photos;
        ejsLocalVariables.searchResults = true;
        return res.render('index', ejsLocalVariables);
      })
      .catch(error => {
        return res.status(500).send({ error });
      });
  });

  app.post('/zip', async (req, res) => {
    const tags = req.query.tags;
    const tagmode = req.query.tagmode;
    queue.startQueue(tags);

    const tagsParams = encodeURIComponent(tags);
    return res.redirect(
      '/?tags=' + tagsParams + '&tagmode=' + tagmode + '&afterPost=true'
    );
  });
}

export { route };
