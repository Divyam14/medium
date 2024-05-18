import { Hono } from "hono";
import { verify } from "hono/jwt";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { createBlogInput, updateBlogInput } from "@divyam14/medium-common-v1"


export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string
        JWT_SECRET: string
    }
    Variables: {
        userId: string
    }
}>()


blogRouter.use('/*', async (c, next) => {
    const authHeader = c.req.header("authorization") || ""

    try {
        const user = await verify(authHeader, c.env.JWT_SECRET)
        if (user) {
            c.set("userId", user.id)
            await next()
        } else {
            c.status(403);
            return c.json({
                message: "You are not logged in"
            })
        }
    } catch (error) {
        c.status(403);
        return c.json({
            message: "You are not logged in"
        })
    }
})



blogRouter.post('/', async (c) => {

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const body = await c.req.json()

    const parsedIp = createBlogInput.safeParse(body)

    if (!parsedIp.success) {

        c.status(403)
        return c.json({
            Error: parsedIp.error
        })
    }


    try {
        const post = await prisma.post.create({
            data: {
                title: body.title,
                content: body.content,
                authorId: c.var.userId
            }
        })

        return c.json({
            msg: "POST CREATED",
            postId: post.id
        })
    } catch (error) {
        c.status(403)
        return c.json({
            error
        })
    }
})


blogRouter.put('/', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const body = await c.req.json()

    const parsedIp = updateBlogInput.safeParse(body)

    if (!parsedIp.success) {
        c.status(403)
        return c.json({
            Error: parsedIp.error
        })
    }


    const userId = c.get('userId')

    try {
        const updatePost = await prisma.post.update({
            where: {
                id: body.id,
                authorId: userId
            },
            data: {
                title: body.title,
                content: body.content
            }

        })

        if (updatePost) {
            c.json({
                msg: "Post updated success"
            })
        } else {
            c.status(403)
            return c.json({
                msg: "Post doesnt exist"
            })
        }
    }
    catch (error) {
        c.status(403)
        return c.json({
            msg: "Post doesnt exist"
        })
    }


})

blogRouter.get('/bulk', async (c) => {

    console.log("I am here")
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    const blogs = await prisma.post.findMany({
        select: {
            content: true,
            title: true,
            id: true,
            author: {
                select: {
                    name: true
                }
            }
        }
    });

    return c.json({
        blogs
    })
})


blogRouter.get('/:id', async (c) => {


    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const postId = c.req.param('id')
    console.log(postId)

    try {
        const post = await prisma.post.findUnique({
            where: {
                id: postId
            }
        })
        return c.json(post)

    } catch (error) {
        c.status(403)
        return c.json({
            msg: "Error while getting post"
        })
    }

})




