const report = require('gatsby-cli/lib/reporter');
const firebase = require('firebase-admin');
const crypto = require('crypto');

const getDigest = (id) => crypto.createHash('md5').update(id).digest('hex');

exports.sourceNodes = async (
  { actions },
  { types, credential, appConfig = undefined }
) => {
  try {
    if (firebase.apps || !firebase.apps.length) {
      const cfg = appConfig
        ? appConfig
        : { credential: firebase.credential.cert(credential) };
      firebase.initializeApp(cfg);
    }
  } catch (e) {
    report.warn(
      'Could not initialize Firebase. Please check `credential` property in gatsby-config.js'
    );
    report.warn(e);
    return;
  }
  // Db Setup
  const db = firebase.firestore();

  db.settings({
    timestampsInSnapshots: true,
  });

  //
  const { createNode } = actions;

  // Promise to get data
  const promises = types.map(
    async ({ collection, type, map = (node) => node }) => {
      const snapshot = await db.collection(collection).get();

      for (let doc of snapshot.docs) {
        const contentDigest = getDigest(doc.id);

        createNode(
          Object.assign({}, map(doc.data()), {
            id: doc.id,
            parent: null,
            children: [],
            internal: {
              type,
              contentDigest,
            },
          })
        );
        Promise.resolve();
      }
    }
  );
  await Promise.all(promises);
  return;
};

//! Test New Version
// const firebase = require("firebase-admin")
// const crypto = require("crypto")

// exports.sourceNodes = (
//   { boundActionCreators },
//   { credential, databaseURL, types, quiet = false },
//   done
// ) => {
//   const { createNode } = boundActionCreators

//   firebase.initializeApp({
//     credential: firebase.credential.cert(credential),
//     databaseURL: databaseURL
//   })

//   const db = firebase.database()

//   const start = Date.now()

//   types.forEach(
//     ({ query = ref => ref, map = node => node, type, path }) => {
//       if (!quiet) {
//         console.log(`\n[Firebase Source] Fetching data for ${type}...`)
//       }

//       query(db.ref(path)).once("value", snapshot => {
//         if (!quiet) {
//           console.log(
//             `\n[Firebase Source] Data for ${type} loaded in`,
//             Date.now() - start,
//             "ms"
//           )
//         }

//         const val = snapshot.val()

//         Object.keys(val).forEach(key => {
//           const node = map(Object.assign({}, val[key]))

//           const contentDigest = crypto
//             .createHash(`md5`)
//             .update(JSON.stringify(node))
//             .digest(`hex`)

//           createNode(
//             Object.assign(node, {
//               id: key,
//               parent: "root",
//               children: [],
//               internal: {
//                 type: type,
//                 contentDigest: contentDigest
//               }
//             })
//           )
//         })
//         done()
//       })
//     },
//     error => {
//       throw new Error(error)
//     }
//   )
// }
//! Test New Version
