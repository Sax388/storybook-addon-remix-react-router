import { RouteObject } from 'react-router';
import { castArray, hasOwnProperty, invariant } from '../../../../utils/misc';
import {
  NonIndexRouteDefinition,
  NonIndexRouteDefinitionObject,
  RouteDefinitionObject,
  RouterRoute,
  RoutingHelper,
} from '../../types';
import { castRouteDefinitionObject } from '../castRouteDefinitionObject';

/**
 * Render the story as the outlet of an ancestor.
 * You can specify multiple ancestors to create a deep nesting.
 * Outlets are nested in a visual/JSX order : the first element of the array will be the root, the last will be
 * the direct parent of the story
 */
export function reactRouterNestedAncestors(
  ancestors: NonIndexRouteDefinition | NonIndexRouteDefinition[]
): [RouterRoute];
export function reactRouterNestedAncestors(
  story: Omit<RouteDefinitionObject, 'element'>,
  ancestors: NonIndexRouteDefinition | NonIndexRouteDefinition[]
): [RouterRoute];
export function reactRouterNestedAncestors(
  ...args:
    | [NonIndexRouteDefinition | NonIndexRouteDefinition[]]
    | [Omit<RouteDefinitionObject, 'element'>, NonIndexRouteDefinition | NonIndexRouteDefinition[]]
): [RouterRoute] {
  const story = (args.length === 1 ? {} : args[0]) as RouteDefinitionObject;
  const ancestors = castArray(args.length === 1 ? args[0] : args[1]);

  invariant(
    !hasOwnProperty(story, 'element'),
    'The story definition cannot contain the `element` property because the story element will be used'
  );

  const ancestorsRoot: RouterRoute = { path: '/' };
  let lastAncestor = ancestorsRoot;

  console.log('ancestorsRoot', ancestorsRoot);

  for (let i = 0; i < ancestors.length; i++) {
    const ancestor = ancestors[i];
    const ancestorDefinitionObjet = castRouteDefinitionObject(ancestor) as NonIndexRouteDefinitionObject;
    ancestorDefinitionObjet.path ??= '';
    lastAncestor.children = [ancestorDefinitionObjet];

    console.log('ancestor #' + i, lastAncestor);
    lastAncestor = ancestorDefinitionObjet;
  }

  lastAncestor.children = [
    {
      ...story,
      index: true,
      useStoryElement: true,
    },
  ];

  return [ancestorsRoot];
}
