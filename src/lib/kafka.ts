import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs'

const kafka = new Kafka({
  clientId: 'listing-ai',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  retry: { initialRetryTime: 300, retries: 8 },
})

let _producer: Producer | null = null

export async function getProducer(): Promise<Producer> {
  if (_producer) return _producer
  _producer = kafka.producer({ allowAutoTopicCreation: true })
  await _producer.connect()
  return _producer
}

export const TOPICS = {
  QUEUE_JOBS: 'listing-ai.queue.jobs',
  QUEUE_RESULTS: 'listing-ai.queue.results',
  SCRAPE_JOBS: 'listing-ai.scrape.jobs',
  SCRAPE_RESULTS: 'listing-ai.scrape.results',
} as const

export async function publishQueueJob(job: {
  userId: string
  queueItemId: number
  productName: string
  category: string
  keywords: string
  price?: string
  extraInfo?: string
  platform: string
  tone: string
  provider: string
  apiKey: string
  model?: string
}): Promise<void> {
  const producer = await getProducer()
  await producer.send({
    topic: TOPICS.QUEUE_JOBS,
    messages: [{ key: job.userId, value: JSON.stringify(job) }],
  })
}

export async function publishScrapeJob(job: {
  userId: string
  urls: string[]
  proxy?: string
  delay?: number
}): Promise<void> {
  const producer = await getProducer()
  await producer.send({
    topic: TOPICS.SCRAPE_JOBS,
    messages: [{ key: job.userId, value: JSON.stringify(job) }],
  })
}

export async function startQueueConsumer(
  groupId: string,
  handler: (payload: EachMessagePayload) => Promise<void>
): Promise<Consumer> {
  const consumer = kafka.consumer({ groupId, sessionTimeout: 30000 })
  await consumer.connect()
  await consumer.subscribe({ topic: TOPICS.QUEUE_JOBS, fromBeginning: false })
  await consumer.run({ eachMessage: handler })
  return consumer
}
