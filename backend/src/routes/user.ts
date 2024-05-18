import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { signinInput,signupInput } from "@divyam14/medium-common-v1";

export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string
        JWT_SECRET: string
    }
    Variables: {
        userId: string
    }
}>()


userRouter.post('/signup', async (c) => {

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const body = await c.req.json()
    const parsedIp = signupInput.safeParse(body)

    if(!parsedIp.success){
        c.status(403)
        return c.json({
            msg: "Wrong ip",
            error: parsedIp.error
        })
    }

    try {
        const user = await prisma.user.create({
            data: {
                email: body.email,
                name: body.name,
                password: body.password
            }
        })

        const token = await sign({ id: user.id }, c.env.JWT_SECRET)

        return c.json(token)

    } catch (error) {
        console.log(error)
        
        c.status(403)
        return c.json({
            msg: "Error"
        })
    }

})


userRouter.post('/signin', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());



    const body = await c.req.json();
    const validInput = signinInput.safeParse(body)

    if(!validInput.success){
        c.status(403)
        return c.json({
            msg: "Wrong ip",
            error: validInput.error
        })
    }

    const user = await prisma.user.findUnique({
        where: {
            email: body.email
        }
    });

    if (!user) {
        c.status(403);
        return c.json({ error: "user not found" });
    }

    const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
    return c.json({ jwt });
})


