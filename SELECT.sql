SELECT
    user.name,
    user.email,
    (
        SELECT
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id',
                    address.id,
                    'city',
                    (
                        SELECT
                            JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'id',
                                    city.id,
                                    'city_name',
                                    city.city_name,
                                    'address_id',
                                    city.address_id
                                )
                            ) AS city
                        FROM
                            city
                        WHERE
                            address.id = city.address_id
                    ),
                    'address_line',
                    address.address_line,
                    'city',
                    (
                        SELECT
                            JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'id',
                                    city.id,
                                    'city_name',
                                    city.city_name,
                                    'address_id',
                                    city.address_id
                                )
                            ) AS city
                        FROM
                            city
                        WHERE
                            address.id = city.address_id
                    )
                )
            ) AS address
    )
FROM
    user
    LEFT JOIN address ON user.id = address.user_id
    LEFT JOIN city ON address.id = city.address_id
GROUP BY
    user.id
LIMIT
    10 OFFSET 0