import { Hono } from "hono";
import { verify } from "hono/jwt";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";


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

blogRouter.post('/',async (c)=>{

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
      }).$extends(withAccelerate())

      const body = await c.req.json()
    try {
        const post = await prisma.post.create({
          data:{
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

    console.log("jlbnruienvbi")
    console.log(c.var.userId)
    return c.json("Blog route")
  })
  
  
  blogRouter.put('/',(c)=>{
    return c.json("Edit blog route")
  })
  
  
  blogRouter.get('/:id',(c)=>{
    return c.json("Specific blog route")
  })
  
  blogRouter.get('/bulk',(c)=>{
    return c.json("Bulk blog route")
  })


