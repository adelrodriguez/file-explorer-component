# File Explorer Component Example

This is an example File Explorer component for a take home assignment. The main goal of this component is to display a list of files and folders in a tree structure, with an accurate representation of the file system hierarchy.

It aims to make use of React best practices, including state management and event handling, while also demonstrating proficiency with TypeScript.

[See a live demo here](https://adelrodriguez-file-explorer-demo.netlify.app)

## Running Locally

To run this project locally, clone the repository and run the following commands:

```bash
npm install
npm dev
```

This project uses Vite for development, which provides a fast development server with hot module reloading. To build the project for production, run:

```bash
npm build
```

A production build will be created in the `dist` directory.

## Design Decisions

Some technologies I used:

- Zod to parse the initial data and make it type-safe.
- Tailwind CSS for styling.
- `parallel/cuid` to generate unique ids for each node.
- `clsx` to conditionally add classes to elements.
- `react-dnd` for drag and drop functionality.

The initial decision when I started to work on this project was how to structure the data to deal with the requirements. I'm a proponent of keeping data structures as close as the UI as possible, so my initial thought was to keep the data in a tree. This presented some benefits:

- It would be easier to render the data in a tree structure using recursion.
- Each node in the tree could be responsible for managing its own state, such as whether it is expanded or collapsed.
- You could have a component for a directory or for a file, simplifying the rendering logic.

I did a quick implementation of this, but as I went further I realized that this way would run into issues:

- I used Zod to validate the data, using recursive types to validate the children in the directories. This worked fine until the time came to add an `id` property to identify each node in the tree. Recursively changing the type of the children to include an `id` property was more difficult than I thought, and I felt that it was not the right path to take the deeper I went.
- While I initially wanted to keep the state contained to each directory node, it was necessary to lift the state up to be able to handle the expand/collapse all nodes at once. I used the Context API for this, but this would lead to every component re-rendering when the state changed, which is not ideal. While performance was not a concern for this project, I felt that this was another sign that I was going down the wrong path.
- I also realized that iw would be difficult to implement some of the features, such as the ability to insert a new node at any level in the tree, or using drag and drop to reorder nodes.

Due to this issues, I decided to rewrite the project using a flat structure. This approach allowed me to solve most of the issues I had with the tree structure and move pretty quickly, but it also presented some challenges:

- I had to keep track of the parent-child relationships in the data, which was not as easy as it was in the tree structure. I added a `parentId` property to each node to keep track of this, but this required extra-logic to keep track of the state of visible directories.
- While working on the drag and drop functionality, difficulties arose in managing the relationship between child and parent nodes. I had to keep track of the parent node when dragging a file, and the parent node and the children when dragging a directory. This was not a problem when dragging a file, but when dragging a directory, it becomes difficult to know exactly which index the directory should be inserted at, since the children are not expanded.

## Improvements

As mentioned before, the drag and drop functionality needs to be completed and improved. The challenge is how to handle the relations when moving either a directory (also moving its children), or while moving a file when a directory is not expanded. I'm not sure yet what the best answer is here, but I would reconsider structuring the data in a tree and using nested drop targets.

Also, I'd include memoization to the nodes to prevent unnecessary re-renders.

Some error states could be added if the data is not parsed correctly.
