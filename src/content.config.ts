import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const buttonSchema = z.object({
  enable: z.boolean(),
  label: z.string(),
  link: z.string(),
});

const statSchema = z.object({
  value: z.number(),
  suffix: z.string().optional(),
  label: z.string(),
});

// Homepage collection schema
const homepageCollection = defineCollection({
  loader: glob({ pattern: "**/-*.{md,mdx}", base: "src/content/homepage" }),
  schema: z.object({
    hero: z.object({
      greeting: z.string(),
      title: z.string(),
      rotating_words: z.array(z.string()),
      content: z.string(),
      location: z.string(),
      availability: z.string(),
      buttons: z.array(buttonSchema),
      marquee: z.array(z.string()),
    }),
    about: z.object({
      subtitle: z.string(),
      title: z.string(),
      content: z.string(),
      image: z.string(),
      facts: z.array(z.object({ label: z.string(), value: z.string() })),
    }),
    experience: z.object({
      subtitle: z.string(),
      title: z.string(),
      jobs: z.array(
        z.object({
          role: z.string(),
          company: z.string(),
          url: z.string(),
          period: z.string(),
          description: z.string(),
          tags: z.array(z.string()).default(() => []),
        }),
      ),
    }),
    skills: z.object({
      subtitle: z.string(),
      title: z.string(),
      groups: z.array(
        z.object({
          name: z.string(),
          items: z.array(z.string()),
        }),
      ),
    }),
    projects: z.object({
      subtitle: z.string(),
      title: z.string(),
      content: z.string(),
      github: z.string(),
      items: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          url: z.string(),
          stars: z.number(),
          language: z.string(),
          archived: z.boolean().optional(),
        }),
      ),
    }),
    opensource: z.object({
      subtitle: z.string(),
      title: z.string(),
      content: z.string(),
      stats: z.array(statSchema),
      button: buttonSchema,
    }),
    services: z.object({
      subtitle: z.string(),
      title: z.string(),
      items: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          icon: z.string(),
        }),
      ),
    }),
    contact: z.object({
      subtitle: z.string(),
      title: z.string(),
      content: z.string(),
      location: z.string(),
      buttons: z.array(buttonSchema),
    }),
  }),
});

// Export collections
export const collections = {
  homepage: homepageCollection,
};
